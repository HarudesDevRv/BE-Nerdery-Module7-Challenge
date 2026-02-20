import { Field, ID, InputType } from '@nestjs/graphql';
import { IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class CreateSingleItemOrderInput {
  @Field(() => ID)
  @IsUUID()
  inventoryId: string;

  @IsString()
  @MaxLength(3)
  currency: string;

  @IsArray()
  @IsOptional()
  codes?: string[];
}
