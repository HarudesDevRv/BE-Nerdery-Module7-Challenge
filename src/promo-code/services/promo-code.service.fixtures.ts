import { DiscountCode, DiscountType } from '@prisma/client';
import { CreatePromoCodeInput } from '../dto/create-promo-code.input';
import { Decimal } from '@prisma/client/runtime/client';

export const createMockStripeService = () => ({
  createPromoCode: jest.fn().mockResolvedValue({
    stripeCouponId: 'coup_123',
    stripePromotionCodeId: 'promo_456',
  }),
  updatePromoCode: jest.fn().mockResolvedValue(undefined),
  disablePromoCode: jest.fn().mockResolvedValue(undefined),
});

export const createMockPromoCodeMapper = () => ({
  formatPromoCode: jest.fn((record: DiscountCode) => ({
    ...record,
    discountValue: 10.0,
    minAmount: record.minAmount ?? undefined,
    stripeCouponId: record.stripeCouponId ?? undefined,
    stripePromotionCodeId: record.stripePromotionCodeId ?? undefined,
  })),
});

export const fakeDiscountCode: Partial<DiscountCode> = {
  discountCodeId: 'dc1',
  code: 'SAVE10',
  discountType: DiscountType.percentage,
  discountValue: Decimal(10.0),
  expirationDate: new Date('2027-01-01'),
  usageLimit: 100,
  minAmount: null,
  isActive: true,
  stripeCouponId: 'coup_123',
  stripePromotionCodeId: 'promo_456',
};

export const fakeDiscountCodeNoStripe: Partial<DiscountCode> = {
  ...fakeDiscountCode,
  stripeCouponId: null,
  stripePromotionCodeId: null,
};

export const fakeDiscountCodeDisabled: Partial<DiscountCode> = {
  ...fakeDiscountCode,
  isActive: false,
};

export const createInput: CreatePromoCodeInput = {
  code: 'SAVE10',
  discountType: DiscountType.percentage,
  discountValue: 10.0,
  expirationDate: new Date('2027-01-01'),
  usageLimit: 100,
};
