import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsPositive,
  IsUUID,
  IsISO4217CurrencyCode,
} from 'class-validator';

export class CreatePaymentIntentDto {
  @IsString()
  @IsUUID(4)
  readonly orderId!: string;

  /**
   *
   * Payment amount expressed in the currency's lowest possible value
   * @example 10000
   */
  @ApiProperty({
    type: 'integer',
  })
  @IsInt()
  @IsPositive()
  readonly amount!: number;

  @ApiProperty({
    description: 'ISO4217 Currency Code',
    example: 'usd',
    format: 'currency',
  })
  @IsString()
  @IsISO4217CurrencyCode()
  readonly currency!: string;
}
