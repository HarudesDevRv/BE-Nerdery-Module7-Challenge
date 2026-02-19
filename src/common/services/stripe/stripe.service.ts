import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

type Price = {
  currency: string;
  unit_amount: number;
  product_date: string;
};

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
    );
  }

  async createCheckoutSession(
    items: Price[],
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        success_url: 'https://example.com/success',
        line_items: items.map((item) => ({ price_data: item })),
        mode: 'payment',
      });
      return session;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Failed to create PaymentIntent', error.stack);
        throw error;
      }
      throw new InternalServerErrorException('Something failed');
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
      });
      this.logger.log(
        `PaymentIntent created successfully with amount: ${amount} ${currency}`,
      );
      return paymentIntent;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Failed to create PaymentIntent', error.stack);
        throw error;
      }
      throw new InternalServerErrorException('Something failed');
    }
  }
}
