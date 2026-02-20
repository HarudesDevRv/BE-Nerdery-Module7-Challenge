import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  LOW_STOCK_QUEUE,
  PASSWORD_RESET_QUEUE,
} from './notifications.constants';

export type LowStockJobData = {
  productName: string;
  stock: number;
  productImageUrl: string | null;
  userEmails: string[];
};

export type PasswordResetJobData = {
  email: string;
  resetToken: string;
  expiresAt: Date;
};

@Injectable()
export class NotificationsProducer {
  constructor(
    @InjectQueue(LOW_STOCK_QUEUE) private lowStockQueue: Queue,
    @InjectQueue(PASSWORD_RESET_QUEUE) private passwordResetQueue: Queue,
  ) {}

  async notifyLowStock(data: LowStockJobData) {
    await this.lowStockQueue.add('low-stock-alert', data);
  }

  async notifyPasswordReset(data: PasswordResetJobData) {
    await this.passwordResetQueue.add('password-reset-email', data);
  }
}
