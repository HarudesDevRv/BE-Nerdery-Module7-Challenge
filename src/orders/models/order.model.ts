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
  readonly inventoryId!: string;

  readonly productName!: string;

  @Field(() => Int)
  readonly amount!: number;

  @Field(() => Float)
  readonly price!: number;
}

@ObjectType()
export class OrderPromoCode {
  readonly code!: string;

  @Field(() => DiscountType)
  readonly discountType!: DiscountType;

  @Field(() => Float)
  readonly discountValue!: number;
}

@ObjectType()
export class Order {
  @Field(() => ID)
  readonly orderId!: string;

  @Field(() => ID)
  readonly paymentId?: string;

  readonly paymentMethod?: string;

  @Field({ nullable: true })
  readonly guestEmail?: string;

  readonly items: OrderItem[];

  @Field(() => Float)
  readonly subtotal!: number;

  @Field(() => Float)
  readonly total!: number;

  @Field(() => OrderStatus)
  readonly status!: OrderStatus;

  readonly promoCodes?: OrderPromoCode[];

  readonly createdAt!: Date;

  readonly updatedAt!: Date;
}
