import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { CreatePaymentIntentDto } from './dto/req/create-payment-intent.dto';
import { CreateCheckoutSessionDto } from './dto/req/create-checkout-session.dto';
import { PaymentIntentResponseDto } from './dto/res/payment-intent-response.dto';
import { CheckoutSessionResponseDto } from './dto/res/checkout-session-response.dto';
import { StripeService } from 'src/common/services/stripe/stripe.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
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
        paymentMethod: null,
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
        paymentMethod: null,
        order: { connect: { orderId: dto.orderId } },
      },
      include: { order: true },
    });
    return plainToInstance(CheckoutSessionResponseDto, checkoutSession, {
      excludeExtraneousValues: true,
    });
  }
}
