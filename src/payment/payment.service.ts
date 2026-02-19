import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { CreatePaymentIntentDto } from './dto/create-payment.dto';
import { StripeService } from 'src/common/services/stripe/stripe.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
  ) {}

  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    // TODO: create Stripe PaymentIntent and store in DB
    const paymentIntent = await this.stripe.createPaymentIntent(
      dto.amount,
      dto.currency,
    );
    console.log(paymentIntent);
    return paymentIntent;
  }

  //   async handleWebhook(payload: Buffer, signature: string) {
  //     // TODO: verify Stripe signature and process webhook event
  //   }
  //
}
