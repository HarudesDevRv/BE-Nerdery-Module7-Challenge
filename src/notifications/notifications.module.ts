import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NotificationsProducer } from './notifications.producer';
import {
  NotificationsProcessor,
  PasswordResetProcessor,
} from './notifications.processor';
import {
  LOW_STOCK_QUEUE,
  PASSWORD_RESET_QUEUE,
} from './notifications.constants';

export { LOW_STOCK_QUEUE, PASSWORD_RESET_QUEUE };

@Module({
  imports: [
    BullModule.registerQueue({ name: LOW_STOCK_QUEUE }),
    BullModule.registerQueue({ name: PASSWORD_RESET_QUEUE }),
  ],
  providers: [
    NotificationsProducer,
    NotificationsProcessor,
    PasswordResetProcessor,
  ],
  exports: [NotificationsProducer],
})
export class NotificationsModule {}
