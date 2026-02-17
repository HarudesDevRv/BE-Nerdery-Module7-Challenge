import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class CartItem {
  productId: string;
  productName: string;
  @Field(() => Int)
  amount: number;
  @Field(() => Float)
  unitPrice: number;
  @Field(() => Float)
  subtotal: number;
}

@ObjectType()
export class Cart {
  @Field(() => ID)
  cartId: string;
  items: CartItem[];
  @Field(() => Float)
  total: number;
}
