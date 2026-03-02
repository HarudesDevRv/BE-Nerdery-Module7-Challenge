import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CartService } from '../../cart/services/cart.service';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { CreateGuestOrderInput } from '../dto/create-guest-order.input';
import { CreateOrderInput } from '../dto/create-order.input';
import { CreateSingleItemOrderInput } from '../dto/create-single-item-order.input';
import { OrderFilterInput } from '../dto/order-filter.input';
import { OrderMapperService } from './order-mapper.service';
import { buildOrderSelect } from '../utils/order-field-map';
import { Order } from '../models/order.model';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private orderUtils: OrderMapperService,
    private cartService: CartService,
  ) {}

  async findAllByUser(
    userId: string,
    filter: OrderFilterInput,
    requestedFields: string[],
  ): Promise<Partial<Order>[]> {
    const take = filter.limit || 10;
    const skip = filter.offset ?? 0;
    const orders = (await this.prisma.order.findMany({
      where: {
        userId,
        ...(filter.status && { status: filter.status }),
        ...(filter.fromDate || filter.toDate
          ? {
              createdAt: {
                ...(filter.fromDate && { gte: filter.fromDate }),
                ...(filter.toDate && { lte: filter.toDate }),
              },
            }
          : {}),
        ...(filter.minTotal !== undefined || filter.maxTotal !== undefined
          ? {
              total: {
                ...(filter.minTotal !== undefined && { gte: filter.minTotal }),
                ...(filter.maxTotal !== undefined && { lte: filter.maxTotal }),
              },
            }
          : {}),
      },
      skip,
      take,
      select: buildOrderSelect(requestedFields),
    })) as unknown as Parameters<typeof this.orderUtils.formatOrder>[0][];

    return orders.map((order) => this.orderUtils.formatOrder(order));
  }

  async findAll(
    filter: OrderFilterInput,
    requestedFields: string[],
  ): Promise<Partial<Order>[]> {
    const take = filter.limit || 10;
    const skip = filter.offset ?? 0;
    const orders = (await this.prisma.order.findMany({
      where: {
        ...(filter.status && { status: filter.status }),
        ...(filter.fromDate || filter.toDate
          ? {
              createdAt: {
                ...(filter.fromDate && { gte: filter.fromDate }),
                ...(filter.toDate && { lte: filter.toDate }),
              },
            }
          : {}),
        ...(filter.minTotal !== undefined || filter.maxTotal !== undefined
          ? {
              total: {
                ...(filter.minTotal !== undefined && { gte: filter.minTotal }),
                ...(filter.maxTotal !== undefined && { lte: filter.maxTotal }),
              },
            }
          : {}),
      },
      skip,
      take,
      select: buildOrderSelect(requestedFields),
    })) as unknown as Parameters<typeof this.orderUtils.formatOrder>[0][];

    return orders.map((order) => this.orderUtils.formatOrder(order));
  }

  async findOne(
    orderId: string,
    userId: string,
    requestedFields: string[],
  ): Promise<Partial<Order>> {
    const order = (await this.prisma.order.findUnique({
      where: { orderId },
      select: buildOrderSelect(requestedFields),
    })) as unknown as Parameters<typeof this.orderUtils.formatOrder>[0] | null;

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException("Can't access this order");
    }

    return this.orderUtils.formatOrder(order);
  }

  async create(
    userId: string,
    input: CreateOrderInput,
  ): Promise<Partial<Order>> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        user: true,
        products: { include: { inventory: { include: { product: true } } } },
      },
    });

    if (!cart) {
      throw new InternalServerErrorException(
        'There was a problem retrieving the user cart, please contact support',
      );
    }

    if (cart.products.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }

    for (const item of cart.products) {
      if (item.inventory.stock < item.amount) {
        throw new BadRequestException(
          `Insufficient stock for "${item.inventory.product.name}": requested ${item.amount}, available ${item.inventory.stock}`,
        );
      }
    }

    const subtotal: number = cart.products.reduce(
      (accumulator, item) =>
        (accumulator += item.amount * item.inventory.salePrice.toNumber()),
      0,
    );

    const deliveryAddressId: string = input.addressId ?? cart.user.addressId;

    const newOrder = await this.prisma.order.create({
      data: {
        userId,
        status: 'pending',
        addressId: deliveryAddressId,
        products: {
          createMany: {
            data: cart.products.map((item) => ({
              inventoryId: item.inventoryId,
              amount: item.amount,
              price: item.inventory.price.toNumber(),
            })),
          },
        },
        subtotal,
        total: subtotal,
        currency: input.currency,
      },
    });

    await this.cartService.clearCart(userId);

    return this.orderUtils.formatCreatedOrder(newOrder, subtotal);
  }

  async createSingleItemOrder(
    userId: string,
    input: CreateSingleItemOrderInput,
  ): Promise<Partial<Order>> {
    const [inventory, user] = await Promise.all([
      this.prisma.inventory.findUnique({
        where: { inventoryId: input.inventoryId },
      }),
      this.prisma.user.findUniqueOrThrow({ where: { userId } }),
    ]);

    if (!inventory || !inventory.isActive || inventory.deletedAt !== null) {
      throw new NotFoundException('Inventory item not found');
    }

    if (inventory.stock < 1) {
      throw new BadRequestException('Inventory item is out of stock');
    }

    const subtotal = inventory.salePrice.toNumber();
    const deliveryAddressId = input.addressId ?? user.addressId;

    const newOrder = await this.prisma.order.create({
      data: {
        userId,
        status: 'pending',
        addressId: deliveryAddressId,
        products: {
          create: {
            inventoryId: inventory.inventoryId,
            amount: 1,
            price: inventory.price.toNumber(),
          },
        },
        subtotal,
        total: subtotal,
        currency: input.currency,
      },
    });

    return this.orderUtils.formatCreatedOrder(newOrder, subtotal);
  }

  async createGuestOrder(
    input: CreateGuestOrderInput,
  ): Promise<Partial<Order>> {
    const inventory = await this.prisma.deletedAtFilter.inventory.findUnique({
      where: { inventoryId: input.inventoryId },
    });

    if (!inventory || !inventory.isActive) {
      throw new NotFoundException('Inventory item not found');
    }

    if (inventory.stock < 1) {
      throw new BadRequestException('Inventory item is out of stock');
    }

    const subtotal = inventory.salePrice.toNumber();

    const newOrder = await this.prisma.order.create({
      data: {
        guestEmail: input.email,
        status: 'pending',
        addressId: input.addressId,
        products: {
          create: {
            inventoryId: inventory.inventoryId,
            amount: 1,
            price: inventory.price.toNumber(),
          },
        },
        subtotal,
        total: subtotal,
        currency: input.currency,
      },
    });

    return this.orderUtils.formatCreatedOrder(newOrder, subtotal);
  }

  async processOrder(orderId: string): Promise<Partial<Order>> {
    const order = await this.prisma.order.findUnique({
      where: { orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'paid') {
      throw new BadRequestException('Can only process orders with paid status');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { orderId },
      data: { status: 'processing' },
    });

    return {
      ...updatedOrder,
      paymentId: updatedOrder.paymentId ?? undefined,
      guestEmail: updatedOrder.guestEmail ?? undefined,
      subtotal: updatedOrder.subtotal.toNumber(),
      total: updatedOrder.total.toNumber(),
    };
  }
}
