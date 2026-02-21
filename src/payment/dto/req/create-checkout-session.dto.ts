import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsISO4217CurrencyCode,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CheckoutItemDto {
  @IsString()
  @IsISO4217CurrencyCode()
  readonly currency!: string;

  @IsInt()
  @IsPositive()
  readonly unitAmount!: number;

  @IsString()
  readonly productName!: string;

  @IsInt()
  @IsPositive()
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
