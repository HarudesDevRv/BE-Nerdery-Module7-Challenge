import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { BaseProduct } from './product.model';
import { PaginationInfo } from '../../common/models/pagination.model';

@ObjectType()
export class ProductsPage {
  @Field(() => [ProductWithDetails])
  items: ProductWithDetails[];

  @Field(() => PaginationInfo)
  pagination: PaginationInfo;
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
