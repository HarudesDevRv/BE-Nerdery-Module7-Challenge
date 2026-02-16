import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
class BaseProduct {
  @Field(() => ID)
  productId: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => [ProductImage])
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

  @Field(() => String, { nullable: true })
  url: string | null;
}

@ObjectType()
export class ProductWithDetails extends BaseProduct {
  @Field()
  category: string;

  @Field()
  brand: string;

  @Field(() => Float)
  price?: number;

  @Field(() => Float)
  salePrice?: number;

  @Field()
  stock?: number;

  @Field()
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

@ObjectType()
export class Inventory {
  @Field(() => ID)
  inventoryId: string;

  @Field(() => ID)
  productId: string;

  @Field(() => ID)
  storeId: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Float, { nullable: true })
  salePrice?: number;

  @Field({ nullable: true })
  stock?: number;

  @Field()
  isActive: boolean;
}

@ObjectType()
export class ManagerProduct extends Product {
  @Field(() => [Inventory])
  inventories: Inventory[];
}
