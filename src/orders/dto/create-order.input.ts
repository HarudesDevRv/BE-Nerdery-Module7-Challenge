import { InputType, Field } from '@nestjs/graphql';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateOrderInput {
  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  codes?: string[];

  @Field()
  @IsString()
  @MaxLength(3)
  currency: string;
}
