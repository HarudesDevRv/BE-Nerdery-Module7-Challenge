import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { LOW_STOCK_QUEUE } from './notifications.module';

export type LowStockJobData = {
  productName: string;
  stock: number;
  productImageUrl: string | null;
  userEmails: string[];
};

@Injectable()
export class NotificationsProducer {
  constructor(@InjectQueue(LOW_STOCK_QUEUE) private lowStockQueue: Queue) {}

  async notifyLowStock(data: LowStockJobData) {
    await this.lowStockQueue.add('low-stock-alert', data);
  }
}
