import {
  ObjectType,
  Field,
  ID,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { DiscountType } from '@prisma/client';

registerEnumType(DiscountType, { name: 'DiscountType' });

@ObjectType()
export class PromoCode {
  @Field(() => ID)
  discountCodeId: string;
  code: string;
  @Field(() => DiscountType)
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
