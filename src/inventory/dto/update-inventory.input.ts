import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, IsPositive, Min } from 'class-validator';

@InputType()
export class UpdateInventoryInput {
  @Field(() => Float)
  @IsOptional()
  @IsPositive()
  readonly price?: number;

  @Field(() => Float)
  @IsOptional()
  @IsPositive()
  readonly salePrice?: number;

  @Field(() => Int)
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly stock?: number;

  @Field(() => Boolean)
  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}
