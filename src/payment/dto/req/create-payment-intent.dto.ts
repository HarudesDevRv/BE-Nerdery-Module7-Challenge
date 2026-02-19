import { IsInt, IsString, IsPositive, Length } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsString()
  orderId: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @Length(3, 3)
  currency: string;
}
