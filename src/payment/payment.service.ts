import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { CreatePaymentIntentDto } from './dto/requests/create-payment-intent.dto';
import { CreateCheckoutSessionDto } from './dto/requests/create-checkout-session.dto';
import { PaymentIntentResponseDto } from './dto/responses/payment-intent-response.dto';
import { CheckoutSessionResponseDto } from './dto/responses/checkout-session-response.dto';
import { StripeService } from 'src/common/services/stripe/stripe.service';
import { PaymentSucceededEvent } from './events/payment-succeeded.event';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private eventEmitter: EventEmitter2,
  ) {}

  private async validateOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'pending') {
      throw new BadRequestException(
        'Can only create payments on pending orders',
      );
    }
  }

  async createPaymentIntent(
    dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    this.logger.log(`Creating payment intent for orderId: ${dto.orderId}`);
    await this.validateOrder(dto.orderId);
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
    this.logger.log(`Creating checkout session for orderId: ${dto.orderId}`);
    await this.validateOrder(dto.orderId);

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
    this.logger.log(`Handling Stripe webhook event: ${event.type}`);
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

    const payload: PaymentSucceededEvent = {
      orderId: updatedOrder.orderId,
      addressId: updatedOrder.addressId,
      products: updatedOrder.products.map((p) => ({
        inventoryId: p.inventoryId,
        amount: p.amount,
      })),
    };

    this.eventEmitter.emit('payment.succeeded', payload);
    this.logger.log(
      `payment.succeeded event emitted for orderId: ${updatedOrder.orderId}`,
    );
  }
}
