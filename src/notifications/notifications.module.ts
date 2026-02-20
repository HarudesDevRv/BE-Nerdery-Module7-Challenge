import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NotificationsProducer } from './notifications.producer';
import { NotificationsProcessor } from './notifications.processor';

export const LOW_STOCK_QUEUE = 'low-stock';

@Module({
  imports: [BullModule.registerQueue({ name: LOW_STOCK_QUEUE })],
  providers: [NotificationsProducer, NotificationsProcessor],
  exports: [NotificationsProducer],
})
export class NotificationsModule {}
