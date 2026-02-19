import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsPositive,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

export class CheckoutItemDto {
  @IsString()
  @Length(3, 3)
  currency: string;

  @IsInt()
  @IsPositive()
  unitAmount: number;

  @IsString()
  productName: string;

  @IsInt()
  @IsPositive()
  quantity: number;
}

export class CreateCheckoutSessionDto {
  @IsString()
  orderId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];
}
