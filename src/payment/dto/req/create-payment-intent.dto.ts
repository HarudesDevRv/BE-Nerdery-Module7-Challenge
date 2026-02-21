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

  @IsInt()
  @IsPositive()
  readonly amount!: number;

  @IsString()
  @IsISO4217CurrencyCode()
  readonly currency!: string;
}
