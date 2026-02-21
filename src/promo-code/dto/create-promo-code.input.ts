import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { registerEnumType } from '@nestjs/graphql';
import { DiscountType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

registerEnumType(DiscountType, { name: 'DiscountType' });

@InputType()
export class CreatePromoCodeInput {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  readonly code!: string;

  @Field(() => DiscountType)
  @IsEnum(DiscountType)
  readonly discountType!: DiscountType;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  readonly discountValue!: number;

  readonly expirationDate!: Date;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  readonly usageLimit!: number;

  @Field(() => Int)
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly minAmount?: number;
}
