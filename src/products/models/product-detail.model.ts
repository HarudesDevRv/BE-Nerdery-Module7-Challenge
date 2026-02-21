import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { BaseProduct } from './product.model';
import { PaginationInfo } from '../../common/models/pagination.model';

@ObjectType()
export class ProductsPage {
  @Field(() => [ProductWithDetails])
  readonly items!: ProductWithDetails[];

  @Field(() => PaginationInfo)
  readonly pagination!: PaginationInfo;
}

@ObjectType()
export class ProductWithDetails extends BaseProduct {
  readonly category!: string;

  readonly brand!: string;

  @Field(() => ID)
  readonly inventoryId: string;

  @Field(() => Float)
  readonly price?: number;

  @Field(() => Float)
  readonly salePrice?: number;

  @Field(() => Int)
  readonly stock?: number;

  @Field(() => Int)
  readonly likesCount?: number;
}
