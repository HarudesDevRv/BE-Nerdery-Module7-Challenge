export class WebhookEventDto {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}
