import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Product } from './product.model';
import { PaginationInfo } from '../../common/models/pagination.model';

@ObjectType()
export class Inventory {
  @Field(() => ID)
  readonly inventoryId!: string;

  @Field(() => ID)
  readonly productId!: string;

  @Field(() => ID)
  readonly storeId!: string;

  @Field(() => Float)
  readonly price?: number;

  @Field(() => Float)
  readonly salePrice?: number;

  @Field(() => Int)
  readonly stock?: number;

  readonly isActive!: boolean;
}

@ObjectType()
export class ManagerProduct extends Product {
  readonly inventories!: Inventory[];
}

@ObjectType()
export class ManagerProductsPage {
  @Field(() => [ManagerProduct])
  readonly items!: ManagerProduct[];

  @Field(() => PaginationInfo)
  readonly pagination!: PaginationInfo;
}
