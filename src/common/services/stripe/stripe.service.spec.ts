import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import Stripe from 'stripe';

const mockCheckoutSessionsCreate = jest.fn();
const mockPaymentIntentsCreate = jest.fn();
const mockCouponsCreate = jest.fn();
const mockCouponsDel = jest.fn();
const mockPromotionCodesCreate = jest.fn();
const mockPromotionCodesUpdate = jest.fn();
const mockWebhooksConstructEvent = jest.fn();

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args),
      },
    },
    paymentIntents: {
      create: (...args: unknown[]) => mockPaymentIntentsCreate(...args),
    },
    coupons: {
      create: (...args: unknown[]) => mockCouponsCreate(...args),
      del: (...args: unknown[]) => mockCouponsDel(...args),
    },
    promotionCodes: {
      create: (...args: unknown[]) => mockPromotionCodesCreate(...args),
      update: (...args: unknown[]) => mockPromotionCodesUpdate(...args),
    },
    webhooks: {
      constructEvent: (...args: unknown[]) =>
        mockWebhooksConstructEvent(...args),
    },
  })),
);

const createMockConfigService = () => ({
  getOrThrow: jest.fn().mockImplementation((key: string) => {
    const config: Record<string, string> = {
      STRIPE_SECRET_KEY: 'sk_test_fake',
      STRIPE_WEBHOOK_SECRET: 'whsec_fake',
    };
    return config[key];
  }),
});

describe('StripeService', () => {
  let service: StripeService;

  beforeEach(async () => {
    mockCheckoutSessionsCreate.mockReset();
    mockPaymentIntentsCreate.mockReset();
    mockCouponsCreate.mockReset();
    mockCouponsDel.mockReset();
    mockPromotionCodesCreate.mockReset();
    mockPromotionCodesUpdate.mockReset();
    mockWebhooksConstructEvent.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: ConfigService, useValue: createMockConfigService() },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCheckoutSession', () => {
    const items = [
      { currency: 'usd', unitAmount: 5000, productName: 'Widget', quantity: 2 },
    ];

    it('should create a session and return the mapped response', async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/c/pay/cs_123',
        id: 'cs_123',
        amount_total: 10000,
        currency: 'usd',
        status: 'open',
      });

      const result = await service.createCheckoutSession(items);

      expect(result).toEqual({
        url: 'https://checkout.stripe.com/c/pay/cs_123',
        checkoutSessionId: 'cs_123',
        amount: 10000,
        currency: 'usd',
        status: 'open',
      });
    });

    it('should map items to Stripe line_items format', async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/c/pay/cs_123',
        id: 'cs_123',
        amount_total: 10000,
        currency: 'usd',
        status: 'open',
      });

      await service.createCheckoutSession(items);

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          allow_promotion_codes: true,
          line_items: [
            {
              quantity: 2,
              price_data: {
                currency: 'usd',
                unit_amount: 5000,
                product_data: { name: 'Widget' },
              },
            },
          ],
        }),
      );
    });

    it('should re-throw errors from Stripe', async () => {
      mockCheckoutSessionsCreate.mockRejectedValue(
        new Error('Stripe connection error'),
      );

      await expect(service.createCheckoutSession(items)).rejects.toThrow(
        'Stripe connection error',
      );
    });
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent and return the mapped response', async () => {
      mockPaymentIntentsCreate.mockResolvedValue({
        client_secret: 'pi_secret_123',
        id: 'pi_123',
        amount: 9999,
        currency: 'usd',
        status: 'requires_payment_method',
      });

      const result = await service.createPaymentIntent(9999, 'usd');

      expect(result).toEqual({
        clientSecret: 'pi_secret_123',
        paymentIntentId: 'pi_123',
        amount: 9999,
        currency: 'usd',
        status: 'requires_payment_method',
      });
      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
        amount: 9999,
        currency: 'usd',
      });
    });

    it('should re-throw errors from Stripe', async () => {
      mockPaymentIntentsCreate.mockRejectedValue(new Error('Invalid currency'));

      await expect(
        service.createPaymentIntent(9999, 'invalid'),
      ).rejects.toThrow('Invalid currency');
    });
  });

  describe('createPromoCode', () => {
    const baseParams = {
      code: 'SAVE10',
      discountType: 'percentage' as const,
      discountValue: 10,
      expirationDate: new Date('2027-01-01'),
      usageLimit: 100,
    };

    beforeEach(() => {
      mockCouponsCreate.mockResolvedValue({ id: 'coupon_123', name: 'SAVE10' });
      mockPromotionCodesCreate.mockResolvedValue({ id: 'promo_123' });
    });

    it('should return stripeCouponId and stripePromotionCodeId', async () => {
      const result = await service.createPromoCode(baseParams);

      expect(result).toEqual({
        stripeCouponId: 'coupon_123',
        stripePromotionCodeId: 'promo_123',
      });
    });

    it('should use percent_off for percentage discounts', async () => {
      await service.createPromoCode({
        ...baseParams,
        discountType: 'percentage',
        discountValue: 10,
      });

      expect(mockCouponsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ percent_off: 10 }),
      );
      expect(mockCouponsCreate).not.toHaveBeenCalledWith(
        expect.objectContaining({ amount_off: expect.anything() }),
      );
    });

    it('should use amount_off in cents for fixed discounts', async () => {
      await service.createPromoCode({
        ...baseParams,
        discountType: 'fixed',
        discountValue: 9.99,
      });

      expect(mockCouponsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ amount_off: 999, currency: 'usd' }),
      );
    });

    it('should add restrictions to the promo code when minAmount is provided', async () => {
      await service.createPromoCode({ ...baseParams, minAmount: 5000 });

      expect(mockPromotionCodesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          restrictions: {
            minimum_amount: 5000,
            minimum_amount_currency: 'usd',
          },
        }),
      );
    });

    it('should not include restrictions when minAmount is absent', async () => {
      await service.createPromoCode(baseParams);

      expect(mockPromotionCodesCreate).not.toHaveBeenCalledWith(
        expect.objectContaining({ restrictions: expect.anything() }),
      );
    });

    it('should throw InternalServerErrorException when coupon has no name', async () => {
      mockCouponsCreate.mockResolvedValue({ id: 'coupon_123', name: null });

      await expect(service.createPromoCode(baseParams)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should re-throw errors from Stripe', async () => {
      mockCouponsCreate.mockRejectedValue(new Error('Coupon limit reached'));

      await expect(service.createPromoCode(baseParams)).rejects.toThrow(
        'Coupon limit reached',
      );
    });
  });

  describe('updatePromoCode', () => {
    it('should set active when isActive is provided', async () => {
      mockPromotionCodesUpdate.mockResolvedValue({});

      await service.updatePromoCode('promo_123', { isActive: false });

      expect(mockPromotionCodesUpdate).toHaveBeenCalledWith('promo_123', {
        active: false,
      });
    });

    it('should set restrictions when minAmount is a number', async () => {
      mockPromotionCodesUpdate.mockResolvedValue({});

      await service.updatePromoCode('promo_123', { minAmount: 2000 });

      expect(mockPromotionCodesUpdate).toHaveBeenCalledWith(
        'promo_123',
        expect.objectContaining({
          restrictions: {
            currency_options: { usd: { minimum_amount: 2000 } },
          },
        }),
      );
    });

    it('should set minimum_amount to undefined when minAmount is null', async () => {
      mockPromotionCodesUpdate.mockResolvedValue({});

      await service.updatePromoCode('promo_123', { minAmount: null });

      expect(mockPromotionCodesUpdate).toHaveBeenCalledWith(
        'promo_123',
        expect.objectContaining({
          restrictions: {
            currency_options: { usd: { minimum_amount: undefined } },
          },
        }),
      );
    });

    it('should re-throw errors from Stripe', async () => {
      mockPromotionCodesUpdate.mockRejectedValue(new Error('Promo not found'));

      await expect(
        service.updatePromoCode('invalid', { isActive: true }),
      ).rejects.toThrow('Promo not found');
    });
  });

  describe('deleteCoupon', () => {
    it('should call stripe.coupons.del with the coupon id', async () => {
      mockCouponsDel.mockResolvedValue({ deleted: true, id: 'coupon_123' });

      await expect(service.deleteCoupon('coupon_123')).resolves.not.toThrow();
      expect(mockCouponsDel).toHaveBeenCalledWith('coupon_123');
    });

    it('should re-throw errors from Stripe', async () => {
      mockCouponsDel.mockRejectedValue(new Error('Coupon not found'));

      await expect(service.deleteCoupon('invalid')).rejects.toThrow(
        'Coupon not found',
      );
    });
  });

  describe('disablePromoCode', () => {
    it('should call promotionCodes.update with active: false', async () => {
      mockPromotionCodesUpdate.mockResolvedValue({});

      await expect(
        service.disablePromoCode('promo_123'),
      ).resolves.not.toThrow();
      expect(mockPromotionCodesUpdate).toHaveBeenCalledWith('promo_123', {
        active: false,
      });
    });

    it('should re-throw errors from Stripe', async () => {
      mockPromotionCodesUpdate.mockRejectedValue(new Error('Promo not found'));

      await expect(service.disablePromoCode('invalid')).rejects.toThrow(
        'Promo not found',
      );
    });
  });

  describe('constructEvent', () => {
    it('should call stripe.webhooks.constructEvent with the webhook secret from config', () => {
      const fakeEvent = { type: 'payment_intent.succeeded' } as Stripe.Event;
      mockWebhooksConstructEvent.mockReturnValue(fakeEvent);

      const rawBody = Buffer.from('{"type":"payment_intent.succeeded"}');
      const result = service.constructEvent(rawBody, 'whsig_abc');

      expect(mockWebhooksConstructEvent).toHaveBeenCalledWith(
        rawBody,
        'whsig_abc',
        'whsec_fake',
      );
      expect(result).toEqual(fakeEvent);
    });
  });
});
