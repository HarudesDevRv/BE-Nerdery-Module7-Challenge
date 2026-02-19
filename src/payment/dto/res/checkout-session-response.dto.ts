import { Expose } from 'class-transformer';

export class CheckoutSessionResponseDto {
  @Expose()
  url: string | null;
}
