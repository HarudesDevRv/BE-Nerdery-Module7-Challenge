import { IsInt, IsString, IsPositive, Length } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @Length(3, 3)
  currency: string;
}
