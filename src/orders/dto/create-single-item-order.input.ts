import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class CreateSingleItemOrderInput {
  @Field(() => ID)
  @IsUUID()
  inventoryId: string;

  @IsString()
  @MaxLength(3)
  currency: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  addressId?: string;
}
