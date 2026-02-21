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
  readonly discountCodeId!: string;

  readonly code!: string;

  @Field(() => DiscountType)
  readonly discountType!: DiscountType;

  @Field(() => Float)
  readonly discountValue!: number;

  readonly expirationDate!: Date;

  @Field(() => Int)
  readonly usageLimit!: number;

  @Field(() => Int)
  readonly minAmount?: number;

  readonly isActive!: boolean;

  readonly stripeCouponId?: string;

  readonly stripePromotionCodeId?: string;
}
