import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsOptional, IsInt, Min } from 'class-validator';

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
  @Min(0)
  readonly minPrice?: number;

  @Field(() => Float)
  @IsOptional()
  readonly maxPrice?: number;
}
