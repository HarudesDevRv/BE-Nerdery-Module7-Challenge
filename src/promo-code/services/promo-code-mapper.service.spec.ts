import { Test, TestingModule } from '@nestjs/testing';
import { PromoCodeMapperService } from './promo-code-mapper.service';
import { DiscountCode, DiscountType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

const makeFakeDiscountCode = (
  overrides: Partial<DiscountCode> = {},
): DiscountCode => ({
  discountCodeId: 'dc1',
  code: 'SAVE10',
  discountType: DiscountType.percentage,
  discountValue: Decimal(10.0),
  expirationDate: new Date('2027-01-01'),
  usageLimit: 100,
  minAmount: null,
  isActive: true,
  stripeCouponId: null,
  stripePromotionCodeId: null,
  ...overrides,
});

describe('PromoCodeMapperService', () => {
  let service: PromoCodeMapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromoCodeMapperService],
    }).compile();

    service = module.get<PromoCodeMapperService>(PromoCodeMapperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should format a promo code converting Decimal discountValue to a number', () => {
    const record = makeFakeDiscountCode();

    const result = service.formatPromoCode(record);

    expect(result.discountCodeId).toBe('dc1');
    expect(result.code).toBe('SAVE10');
    expect(result.discountValue).toBe(10.0);
    expect(result.discountType).toBe(DiscountType.percentage);
    expect(result.isActive).toBe(true);
  });

  it('should map null optional fields to undefined', () => {
    const record = makeFakeDiscountCode({
      minAmount: null,
      stripeCouponId: null,
      stripePromotionCodeId: null,
    });

    const result = service.formatPromoCode(record);

    expect(result.minAmount).toBeUndefined();
    expect(result.stripeCouponId).toBeUndefined();
    expect(result.stripePromotionCodeId).toBeUndefined();
  });

  it('should preserve non-null optional fields', () => {
    const record = makeFakeDiscountCode({
      minAmount: 50,
      stripeCouponId: 'coup_123',
      stripePromotionCodeId: 'promo_456',
    });

    const result = service.formatPromoCode(record);

    expect(result.minAmount).toBe(50);
    expect(result.stripeCouponId).toBe('coup_123');
    expect(result.stripePromotionCodeId).toBe('promo_456');
  });

  it('should handle a fixed discount type', () => {
    const record = makeFakeDiscountCode({
      discountType: DiscountType.fixed,
      discountValue: Decimal(15.5),
    });

    const result = service.formatPromoCode(record);

    expect(result.discountType).toBe(DiscountType.fixed);
    expect(result.discountValue).toBe(15.5);
  });
});
