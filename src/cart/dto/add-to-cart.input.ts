import { InputType, Field, Int } from '@nestjs/graphql';
import { IsUUID, IsInt, Min } from 'class-validator';

@InputType()
export class AddToCartInput {
  @IsUUID()
  inventoryId: string;
  @Field(() => Int)
  @IsInt()
  @Min(1)
  amount: number;
}
