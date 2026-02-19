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
  code: string;
  @IsEnum(DiscountType)
  discountType: DiscountType;
  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  discountValue: number;
  expirationDate: Date;
  @Field(() => Int)
  @IsInt()
  @Min(1)
  usageLimit: number;
  @Field(() => Int)
  @IsOptional()
  @IsInt()
  @Min(0)
  minAmount?: number;
}
