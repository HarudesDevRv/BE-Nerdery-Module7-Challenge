import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, IsPositive } from 'class-validator';

@InputType()
export class ProductFilterInput {
  @IsOptional()
  readonly category?: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly page?: number;

  @Field(() => Int, { defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly limit?: number;

  @Field(() => Float)
  @IsOptional()
  @IsPositive()
  readonly minPrice?: number;

  @Field(() => Float)
  @IsOptional()
  @IsPositive()
  readonly maxPrice?: number;
}
