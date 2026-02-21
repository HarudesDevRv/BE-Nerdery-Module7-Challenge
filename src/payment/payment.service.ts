import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { CreatePaymentIntentDto } from './dto/requests/create-payment-intent.dto';
import { CreateCheckoutSessionDto } from './dto/requests/create-checkout-session.dto';
import { PaymentIntentResponseDto } from './dto/responses/payment-intent-response.dto';
import { CheckoutSessionResponseDto } from './dto/responses/checkout-session-response.dto';
import { StripeService } from 'src/common/services/stripe/stripe.service';
import Stripe from 'stripe';
import { NotificationsProducer } from 'src/notifications/notifications.producer';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private notificationsProducer: NotificationsProducer,
  ) {}

  async createPaymentIntent(
    dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    const paymentIntent = await this.stripe.createPaymentIntent(
      dto.amount,
      dto.currency,
    );

    if (!paymentIntent.clientSecret) {
      throw new InternalServerErrorException(
        'Something wrong happened when creating the payment intent',
      );
    }

    await this.prisma.payment.create({
      data: {
        paymentId: paymentIntent.paymentIntentId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        paymentMethod: 'payment_intent',
        order: { connect: { orderId: dto.orderId } },
      },
      include: { order: true },
    });

    return plainToInstance(PaymentIntentResponseDto, paymentIntent, {
      excludeExtraneousValues: true,
    });
  }

  async createCheckoutSession(
    dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponseDto> {
    const checkoutSession = await this.stripe.createCheckoutSession(dto.items);

    const { url, amount, currency, status, checkoutSessionId } =
      checkoutSession;

    if ([url, amount, currency, status].some((field) => !field)) {
      throw new InternalServerErrorException(
        'Something wrong happened when creating the payment intent',
      );
    }

    await this.prisma.payment.create({
      data: {
        paymentId: checkoutSessionId,
        amount: amount!,
        currency: currency!,
        status: status!,
        paymentMethod: 'checkout_session',
        order: { connect: { orderId: dto.orderId } },
      },
      include: { order: true },
    });
    return plainToInstance(CheckoutSessionResponseDto, checkoutSession, {
      excludeExtraneousValues: true,
    });
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    let paymentId: string | null = null;
    //TODO: Update the promo codes used on the order payment
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await this.prisma.payment.update({
          where: { paymentId: paymentIntent.id },
          data: { status: 'succeeded' },
        });
        paymentId = paymentIntent.id;
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object;
        await this.prisma.payment.update({
          where: { paymentId: session.id },
          data: { status: 'complete' },
        });
        paymentId = session.id;
        break;
      }
    }
    if (!paymentId) {
      throw new InternalServerErrorException(
        "The payment couldn't be processed",
      );
    }
    const updatedOrder = await this.prisma.order.update({
      where: { paymentId },
      data: { status: 'paid' },
      include: { products: { include: { products: true } } },
    });

    if (!updatedOrder) {
      throw new InternalServerErrorException(
        'There was a problem updating the order',
      );
    }

    if (!updatedOrder.addressId) {
      return;
    }

    for (const item of updatedOrder.products) {
      await this.decrementStockAndNotify(item.inventoryId, item.amount);
    }

    await this.prisma.delivery.create({
      data: {
        orderId: updatedOrder.orderId,
        addressId: updatedOrder.addressId,
      },
    });
  }

  private async decrementStockAndNotify(
    inventoryId: string,
    amount: number,
  ): Promise<void> {
    const updatedInventory = await this.prisma.inventory.update({
      where: { inventoryId },
      data: { stock: { decrement: amount } },
      include: {
        product: { include: { images: true } },
      },
    });

    if (updatedInventory.stock <= 3) {
      const { _sum } = await this.prisma.inventory.aggregate({
        where: { productId: updatedInventory.productId },
        _sum: { stock: true },
      });
      const totalStock = _sum.stock ?? 0;

      if (totalStock <= 3) {
        const likes = await this.prisma.userLike.findMany({
          where: {
            productId: updatedInventory.productId,
            isActive: true,
            user: {
              orders: {
                none: {
                  status: {
                    in: ['paid', 'processing', 'shipped', 'delivered'],
                  },
                  products: {
                    some: {
                      products: {
                        productId: updatedInventory.productId,
                      },
                    },
                  },
                },
              },
            },
          },
          include: { user: true },
        });

        await this.notificationsProducer.notifyLowStock({
          productName: updatedInventory.product.name,
          stock: totalStock,
          userEmails: likes.map((like) => like.user.email),
          productImageUrl:
            updatedInventory.product.images.length > 0
              ? updatedInventory.product.images[0].url
              : null,
        });
      }
    }
  }
}
