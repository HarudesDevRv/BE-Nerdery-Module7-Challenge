import {
  ObjectType,
  Field,
  ID,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { DiscountType, OrderStatus } from '@prisma/client';

registerEnumType(DiscountType, { name: 'DiscountType' });

registerEnumType(OrderStatus, { name: 'OrderStatus' });

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
  @Field({ nullable: true })
  guestEmail?: string;
  items: OrderItem[];
  @Field(() => Float)
  subtotal: number;
  @Field(() => Float)
  total: number;
  status: OrderStatus;
  promoCodes?: OrderPromoCode[];
  createdAt: Date;
  updatedAt: Date;
}
