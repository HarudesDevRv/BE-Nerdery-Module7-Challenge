import { Expose } from 'class-transformer';

export class PaymentIntentResponseDto {
  @Expose()
  readonly clientSecret: string;

  @Expose()
  readonly paymentIntentId: string;
}
