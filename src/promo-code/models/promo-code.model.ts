import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { DiscountType } from '@prisma/client';

@ObjectType()
export class PromoCode {
  @Field(() => ID)
  discountCodeId: string;
  code: string;
  discountType: DiscountType;
  @Field(() => Float)
  discountValue: number;
  expirationDate: Date;
  @Field(() => Int)
  usageLimit: number;
  @Field(() => Int)
  minAmount?: number;
  isActive: boolean;
  stripeCouponId?: string;
  stripePromotionCodeId?: string;
}
