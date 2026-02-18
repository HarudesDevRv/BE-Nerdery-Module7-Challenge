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
import { OrderFilterInput } from './dto/order-filter.input';
import { Order } from './models/order.model';
import { OrderUtilsService } from './order-utils.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private orderUtils: OrderUtilsService,
    private cartService: CartService,
  ) {}

  async findAll(userId: string, filter: OrderFilterInput): Promise<Order[]> {
    const take = filter.limit || 10;
    const skip = ((filter.page || 1) - 1) * take;
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        products: {
          include: { products: { include: { product: true } } },
        },
        discountCodes: {
          include: {
            discountCodes: {
              select: { discountType: true, discountValue: true, code: true },
            },
          },
        },
      },
      skip,
      take,
    });

    return orders.map((order) => this.orderUtils.formatOrder(order));
  }

  async findOne(orderId: string, userId: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { orderId },
      include: {
        products: {
          include: { products: { include: { product: true } } },
        },
        discountCodes: {
          include: {
            discountCodes: {
              select: { discountType: true, discountValue: true, code: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException("Can't access this order");
    }

    return this.orderUtils.formatOrder(order);
  }

  async create(userId: string, input: CreateOrderInput): Promise<Order> {
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
        discountCodes:
          codes.length > 0
            ? {
                createMany: {
                  data: codes.map((code) => ({
                    discountCodeId: code.discountCodeId,
                  })),
                },
              }
            : undefined,
      },
    });

    await this.cartService.clearCart(userId);

    return this.orderUtils.formatCreatedOrder(
      newOrder,
      cart.products,
      subtotal,
      total,
    );
  }
}
