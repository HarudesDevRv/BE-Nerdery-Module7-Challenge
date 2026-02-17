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
  @Field(() => ID)
  inventoryId: string;
  productName: string;
  @Field(() => Int)
  amount: number;
  @Field(() => Float)
  price: number;
}

@ObjectType()
export class OrderPromoCode {
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
  @Field(() => ID)
  paymentId?: string;
  items: OrderItem[];
  @Field(() => Float)
  subtotal: number;
  @Field(() => Float)
  total: number;
  promoCodes?: OrderPromoCode[];
  createdAt: Date;
  updatedAt: Date;
}
