import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class CartItem {
  readonly productId!: string;

  readonly productName!: string;

  @Field(() => Int)
  readonly amount!: number;

  @Field(() => Float)
  readonly unitPrice!: number;

  @Field(() => Float)
  readonly subtotal!: number;
}

@ObjectType()
export class Cart {
  @Field(() => ID)
  readonly cartId!: string;

  readonly items!: CartItem[];

  @Field(() => Float)
  readonly total!: number;
}
