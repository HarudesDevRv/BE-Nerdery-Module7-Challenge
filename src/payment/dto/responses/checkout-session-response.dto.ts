import { Expose } from 'class-transformer';

export class CheckoutSessionResponseDto {
  @Expose()
  readonly url: string;
}
