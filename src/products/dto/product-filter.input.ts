import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsOptional, IsInt, Min } from 'class-validator';

@InputType()
export class ProductFilterInput {
  @IsOptional()
  category?: string;
  @Field(() => Int, { defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;
  @Field(() => Int, { defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
  @Field(() => Float)
  @IsOptional()
  @Min(0)
  minPrice?: number;
  @Field(() => Float)
  @IsOptional()
  maxPrice?: number;
}
