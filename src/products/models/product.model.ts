import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
class BaseProduct {
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
export class ProductWithDetails extends BaseProduct {
  category: string;
  brand: string;
  @Field(() => Float)
  price?: number;
  @Field(() => Float)
  salePrice?: number;
  @Field(() => Int)
  stock?: number;
  @Field(() => Int)
  likesCount?: number;
}

@ObjectType()
export class Category {
  name: string;
  description: string;
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
  @Field(() => Float)
  price?: number;
  @Field(() => Float)
  salePrice?: number;
  @Field(() => Int)
  stock?: number;
  isActive: boolean;
}

@ObjectType()
export class ManagerProduct extends Product {
  inventories: Inventory[];
}
