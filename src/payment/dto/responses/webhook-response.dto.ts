import { Expose } from 'class-transformer';

export class WebhookResponseDto {
  @Expose()
  readonly received: boolean;
}
