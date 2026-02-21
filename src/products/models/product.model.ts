import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class BaseProduct {
  @Field(() => ID)
  readonly productId!: string;

  readonly name!: string;

  readonly description!: string;

  readonly images!: ProductImage[];
}

@ObjectType()
export class Product extends BaseProduct {
  @Field(() => ID)
  readonly categoryId!: string;

  @Field(() => ID)
  readonly brandId!: string;
}

@ObjectType()
export class ProductImage {
  @Field(() => ID)
  readonly imageId!: string;

  readonly url?: string;
}

@ObjectType()
export class Category {
  readonly name!: string;

  readonly description!: string;

  readonly imageUrl!: string;
}
