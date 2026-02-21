import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Store {
  @Field(() => ID)
  readonly storeId!: string;

  readonly name!: string;
}
