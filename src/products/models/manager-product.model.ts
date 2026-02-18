import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Product } from './product.model';
import { PaginationInfo } from '../../common/models/pagination.model';

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

@ObjectType()
export class ManagerProductsPage {
  @Field(() => [ManagerProduct])
  items: ManagerProduct[];

  @Field(() => PaginationInfo)
  pagination: PaginationInfo;
}
