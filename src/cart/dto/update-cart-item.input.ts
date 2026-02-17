import { InputType, Field, Int } from '@nestjs/graphql';
import { IsUUID, IsInt, Min } from 'class-validator';

@InputType()
export class UpdateCartItemInput {
  @IsUUID()
  inventoryId: string;
  @Field(() => Int)
  @IsInt()
  @Min(0)
  amount: number;
}
