import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsISO4217CurrencyCode,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CheckoutItemDto {
  @ApiProperty({
    description: 'ISO4217 Currency Code',
    example: 'usd',
    format: 'currency',
  })
  @IsString()
  @IsISO4217CurrencyCode()
  readonly currency!: string;

  /**
   *
   * Unit amount expressed in the currency's lowest possible value
   * @example 10000
   */
  @ApiProperty({
    type: 'integer',
  })
  @IsInt()
  @IsPositive()
  readonly unitAmount!: number;

  @IsString()
  readonly productName!: string;

  @IsInt()
  @Min(1)
  readonly quantity!: number;
}

export class CreateCheckoutSessionDto {
  @IsString()
  @IsUUID(4)
  readonly orderId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  readonly items!: CheckoutItemDto[];
}
