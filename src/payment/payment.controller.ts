import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Headers,
  RawBody,
  InternalServerErrorException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/requests/create-payment-intent.dto';
import { CreateCheckoutSessionDto } from './dto/requests/create-checkout-session.dto';
import { StripeService } from 'src/common/services/stripe/stripe.service';
import Stripe from 'stripe';
import { PaymentIntentResponseDto } from './dto/responses/payment-intent-response.dto';
import { CheckoutSessionResponseDto } from './dto/responses/checkout-session-response.dto';
import { WebhookResponseDto } from './dto/responses/webhook-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('payments')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private stripeService: StripeService,
  ) {}

  @ApiBearerAuth('access-token')
  @Post('payment-intents')
  createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    return this.paymentService.createPaymentIntent(dto);
  }

  @ApiBearerAuth('access-token')
  @Post('checkout-sessions')
  createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponseDto> {
    return this.paymentService.createCheckoutSession(dto);
  }

  @Post('webhooks')
  @Public()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() rawBody: Buffer,
  ): Promise<WebhookResponseDto> {
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
      } else {
        throw new InternalServerErrorException('Something went wrong');
      }
    }
  }
}
