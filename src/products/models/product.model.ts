import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class BaseProduct {
  @Field(() => ID)
  productId: string;
  name: string;
  description: string;
  images: ProductImage[];
}

@ObjectType()
export class Product extends BaseProduct {
  @Field(() => ID)
  categoryId: string;
  @Field(() => ID)
  brandId: string;
}

@ObjectType()
export class ProductImage {
  @Field(() => ID)
  imageId: string;
  url: string | null;
}

@ObjectType()
export class Category {
  name: string;
  description: string;
  imageUrl: string;
}
