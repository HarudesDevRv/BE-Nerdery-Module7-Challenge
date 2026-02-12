import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
class BaseProduct {
  @Field(() => ID)
  productId: string;

  @Field()
  name: string;

  @Field()
  description: string;
}

@ObjectType()
export class Product extends BaseProduct {
  @Field()
  categoryId: string;

  @Field()
  brandId: string;
}

@ObjectType()
export class ProductImage {
  @Field(() => ID)
  imageId: string;

  @Field()
  url: string;
}

@ObjectType()
export class ProductWithDetails extends BaseProduct {
  @Field(() => [ProductImage], { nullable: true })
  images?: ProductImage[];

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Float, { nullable: true })
  salePrice?: number;

  @Field({ nullable: true })
  stock?: number;

  @Field({ nullable: true })
  likesCount?: number;
}

@ObjectType()
export class Category {
  @Field()
  name: string;

  @Field()
  description: string;

  @Field()
  imageUrl: string;
}
