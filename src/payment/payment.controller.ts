import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
  Headers,
  RawBody,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/req/create-payment-intent.dto';
import { CreateCheckoutSessionDto } from './dto/req/create-checkout-session.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StripeService } from 'src/common/services/stripe/stripe.service';
import Stripe from 'stripe';

@Controller('payments')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private stripeService: StripeService,
  ) {}

  @Post('payment-intents')
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.paymentService.createPaymentIntent(dto);
  }

  @Post('checkout-sessions')
  @UseGuards(JwtAuthGuard)
  createCheckoutSession(@Body() dto: CreateCheckoutSessionDto) {
    return this.paymentService.createCheckoutSession(dto);
  }

  @Post('webhooks')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() rawBody: Buffer,
  ) {
    let event: Stripe.Event;
    try {
      event = this.stripeService.constructEvent(rawBody, signature);
      await this.paymentService.handleWebhook(event);
      return { received: true };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(
          `Webhook signature verification failed: ${error.message}`,
        );
      }
    }
  }
}
