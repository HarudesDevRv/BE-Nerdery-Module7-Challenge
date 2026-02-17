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
export class OrderItem {
  @Field()
  inventoryId: string;

  @Field()
  productName: string;

  @Field(() => Int)
  amount: number;

  @Field(() => Float)
  price: number;
}

@ObjectType()
export class OrderPromoCode {
  @Field()
  code: string;

  @Field(() => DiscountType)
  discountType: DiscountType;

  @Field(() => Float)
  discountValue: number;
}

@ObjectType()
export class Order {
  @Field(() => ID)
  orderId: string;

  @Field(() => ID, { nullable: true })
  paymentId?: string;

  @Field(() => [OrderItem])
  items: OrderItem[];

  @Field(() => Float)
  subtotal: number;

  @Field(() => Float)
  total: number;

  @Field(() => [OrderPromoCode], { nullable: true })
  promoCodes?: OrderPromoCode[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
