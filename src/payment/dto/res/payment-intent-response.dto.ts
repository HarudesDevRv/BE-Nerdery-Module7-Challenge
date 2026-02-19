import { Expose } from 'class-transformer';

export class PaymentIntentResponseDto {
  @Expose()
  clientSecret: string | null;

  @Expose()
  paymentIntentId: string;
}
