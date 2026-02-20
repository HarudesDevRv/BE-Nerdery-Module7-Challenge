import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CartService } from '../cart/services/cart.service';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { CreateOrderInput } from './dto/create-order.input';
import { CreateSingleItemOrderInput } from './dto/create-single-item-order.input';
import { OrderFilterInput } from './dto/order-filter.input';
import { OrderUtilsService } from './order-utils.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private orderUtils: OrderUtilsService,
    private cartService: CartService,
  ) {}

  async findAllByUser(userId: string, filter: OrderFilterInput) {
    const take = filter.limit || 10;
    const skip = filter.offset ?? 0;
    const orders = await this.prisma.order.findMany({
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
    });

    return orders.map((order) => this.orderUtils.formatOrder(order));
  }

  async findAll(filter: OrderFilterInput) {
    const take = filter.limit || 10;
    const skip = filter.offset ?? 0;
    const orders = await this.prisma.order.findMany({
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
    });

    return orders.map((order) => this.orderUtils.formatOrder(order));
  }

  async findOne(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException("Can't access this order");
    }

    return this.orderUtils.formatOrder(order);
  }

  async create(userId: string, input: CreateOrderInput) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
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

    const codes =
      input.codes && input.codes.length > 0
        ? await this.prisma.discountCode.findMany({
            where: {
              code: { in: input.codes },
              expirationDate: { gt: new Date() },
            },
            select: {
              code: true,
              discountType: true,
              discountValue: true,
              discountCodeId: true,
              usageLimit: true,
              _count: { select: { orders: true } },
            },
          })
        : [];

    if (input.codes && codes.length !== input.codes.length) {
      throw new BadRequestException('Discount code not found');
    }

    const exhaustedCodes = codes.filter(
      (code) => code._count.orders >= code.usageLimit,
    );

    if (exhaustedCodes.length > 0) {
      throw new BadRequestException(
        `Discount code "${exhaustedCodes[0].code}" has reached its usage limit`,
      );
    }

    const subtotal = cart.products.reduce(
      (accumulator, item) =>
        (accumulator += item.amount * item.inventory.salePrice.toNumber()),
      0,
    );

    const total = codes.reduce(
      (accumulator, code) =>
        accumulator -
        (code.discountType == 'fixed'
          ? code.discountValue.toNumber()
          : (subtotal * code.discountValue.toNumber()) / 100),
      subtotal,
    );

    const newOrder = await this.prisma.order.create({
      data: {
        userId,
        status: 'pending',
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
        total,
        currency: input.currency,
      },
    });

    await this.cartService.clearCart(userId);

    return this.orderUtils.formatCreatedOrder(newOrder, subtotal, total);
  }

  async createSingleItemOrder(
    userId: string,
    input: CreateSingleItemOrderInput,
  ) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { inventoryId: input.inventoryId },
    });

    if (!inventory || !inventory.isActive || inventory.deletedAt !== null) {
      throw new NotFoundException('Inventory item not found');
    }

    if (inventory.stock < 1) {
      throw new BadRequestException('Inventory item is out of stock');
    }

    const codes =
      input.codes && input.codes.length > 0
        ? await this.prisma.discountCode.findMany({
            where: {
              code: { in: input.codes },
              expirationDate: { gt: new Date() },
            },
            select: {
              code: true,
              discountType: true,
              discountValue: true,
              discountCodeId: true,
              usageLimit: true,
              _count: { select: { orders: true } },
            },
          })
        : [];

    if (input.codes && codes.length !== input.codes.length) {
      throw new BadRequestException('Discount code not found');
    }

    const exhaustedCodes = codes.filter(
      (code) => code._count.orders >= code.usageLimit,
    );

    if (exhaustedCodes.length > 0) {
      throw new BadRequestException(
        `Discount code "${exhaustedCodes[0].code}" has reached its usage limit`,
      );
    }

    const subtotal = inventory.salePrice.toNumber();

    const total = codes.reduce(
      (accumulator, code) =>
        accumulator -
        (code.discountType == 'fixed'
          ? code.discountValue.toNumber()
          : (subtotal * code.discountValue.toNumber()) / 100),
      subtotal,
    );

    const newOrder = await this.prisma.order.create({
      data: {
        userId,
        status: 'pending',
        products: {
          create: {
            inventoryId: inventory.inventoryId,
            amount: 1,
            price: inventory.price.toNumber(),
          },
        },
        subtotal,
        total,
        currency: input.currency,
      },
    });

    return this.orderUtils.formatCreatedOrder(newOrder, subtotal, total);
  }
}
