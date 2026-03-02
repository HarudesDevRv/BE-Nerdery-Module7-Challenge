import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class PaginationInfo {
  @Field(() => Int)
  readonly totalItems!: number;

  @Field(() => Int)
  readonly totalPages!: number;

  @Field(() => Int)
  readonly currentPage!: number;

  readonly hasNextPage!: boolean;
}
