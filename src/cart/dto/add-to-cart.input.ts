import { InputType, Field, Int } from '@nestjs/graphql';
import { IsUUID, IsInt, Min } from 'class-validator';

@InputType()
export class AddToCartInput {
  @IsUUID()
  readonly inventoryId!: string;
  @Field(() => Int)
  @IsInt()
  @Min(1)
  readonly amount!: number;
}
