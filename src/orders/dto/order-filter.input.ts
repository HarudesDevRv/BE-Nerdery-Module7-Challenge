import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, Min } from 'class-validator';

@InputType()
export class OrderFilterInput {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
