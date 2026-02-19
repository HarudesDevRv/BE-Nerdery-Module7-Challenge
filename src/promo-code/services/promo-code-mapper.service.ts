import { Injectable } from '@nestjs/common';
import { DiscountCode } from '@prisma/client';
import { PromoCode } from '../models/promo-code.model';

@Injectable()
export class PromoCodeMapperService {
  formatPromoCode(record: DiscountCode): PromoCode {
    return {
      ...record,
      discountValue: record.discountValue.toNumber(),
      minAmount: record.minAmount ?? undefined,
      stripeCouponId: record.stripeCouponId ?? undefined,
      stripePromotionCodeId: record.stripePromotionCodeId ?? undefined,
    };
  }
}
