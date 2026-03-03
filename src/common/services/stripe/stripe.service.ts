import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

type ItemData = {
  currency: string;
  unitAmount: number;
  productName: string;
  quantity: number;
};

type PromoCode = {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expirationDate: Date;
  usageLimit: number;
  minAmount?: number;
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

  async createCheckoutSession(items: ItemData[]) {
    this.logger.log(`Creating checkout session for ${items.length} item(s)`);
    try {
      const session = await this.stripe.checkout.sessions.create({
        success_url: 'https://example.com/success',
        line_items: items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: item.currency,
            unit_amount: item.unitAmount,
            product_data: { name: item.productName },
          },
        })),
        mode: 'payment',
        allow_promotion_codes: true,
      });
      this.logger.log(`Checkout session created: ${session.id}`);
      return {
        url: session.url,
        checkoutSessionId: session.id,
        amount: session.amount_total,
        currency: session.currency,
        status: session.status,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new InternalServerErrorException('Something failed');
    }
  }

  async createPaymentIntent(amount: number, currency: string) {
    this.logger.log(
      `Creating payment intent: amount=${amount}, currency=${currency}`,
    );
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
      });
      this.logger.log(`Payment intent created: ${paymentIntent.id}`);
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new InternalServerErrorException('Something failed');
    }
  }

  async createPromoCode(
    params: PromoCode,
  ): Promise<{ stripeCouponId: string; stripePromotionCodeId: string }> {
    this.logger.log(`Creating promo code: ${params.code}`);
    try {
      const couponParams: Stripe.CouponCreateParams = {
        name: params.code,
        duration: 'once',
        redeem_by: Math.floor(params.expirationDate.getTime() / 1000),
        max_redemptions: params.usageLimit,
        ...(params.discountType === 'percentage'
          ? { percent_off: params.discountValue }
          : {
              amount_off: Math.round(params.discountValue * 100),
              currency: 'usd',
            }),
      };
      const coupon = await this.stripe.coupons.create(couponParams);

      if (!coupon.name) {
        throw new InternalServerErrorException('Something failed');
      }

      const promoParams: Stripe.PromotionCodeCreateParams = {
        promotion: {
          type: 'coupon',
          coupon: coupon.name,
        },
        code: params.code,
        max_redemptions: params.usageLimit,
        ...(params.minAmount != null && {
          restrictions: {
            minimum_amount: params.minAmount,
            minimum_amount_currency: 'usd',
          },
        }),
      };

      const promotionCode =
        await this.stripe.promotionCodes.create(promoParams);

      this.logger.log(
        `Promo code created — coupon: ${coupon.id}, promotionCode: ${promotionCode.id}`,
      );
      return {
        stripeCouponId: coupon.id,
        stripePromotionCodeId: promotionCode.id,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new InternalServerErrorException('Something failed');
    }
  }

  async updatePromoCode(
    stripePromotionCodeId: string,
    params: { isActive?: boolean; minAmount?: number | null },
  ): Promise<void> {
    this.logger.log(`Updating promo code: ${stripePromotionCodeId}`);
    try {
      const updateParams: Stripe.PromotionCodeUpdateParams = {};
      if (params.isActive !== undefined) {
        updateParams.active = params.isActive;
      }
      if (params.minAmount !== undefined) {
        updateParams.restrictions = {
          currency_options: {
            usd: { minimum_amount: params.minAmount ?? undefined },
          },
        };
      }
      await this.stripe.promotionCodes.update(
        stripePromotionCodeId,
        updateParams,
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new InternalServerErrorException('Something failed');
    }
  }

  async deleteCoupon(stripeCouponId: string): Promise<void> {
    this.logger.log(`Deleting coupon: ${stripeCouponId}`);
    try {
      await this.stripe.coupons.del(stripeCouponId);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new InternalServerErrorException('Something failed');
    }
  }

  async disablePromoCode(stripePromotionCodeId: string): Promise<void> {
    this.logger.log(`Disabling promo code: ${stripePromotionCodeId}`);
    try {
      await this.stripe.promotionCodes.update(stripePromotionCodeId, {
        active: false,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new InternalServerErrorException('Something failed');
    }
  }

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    this.logger.log('Constructing Stripe webhook event');
    const webhookSecret = this.configService.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  }
}
