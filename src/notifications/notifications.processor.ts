import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  LOW_STOCK_QUEUE,
  PASSWORD_RESET_QUEUE,
} from './notifications.constants';
import {
  LowStockJobData,
  PasswordResetJobData,
} from './notifications.producer';
import { MailerService } from './mailer.service';

@Processor(LOW_STOCK_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly mailer: MailerService) {
    super();
  }

  async process(job: Job<LowStockJobData>): Promise<void> {
    const { productName, stock, userEmails, productImageUrl } = job.data;

    for (const email of userEmails) {
      await this.mailer.sendMail({
        to: email,
        subject: `Low stock alert: ${productName}`,
        html: `
          <h2>Only ${stock} units of "${productName}" left!</h2>
          ${productImageUrl ? `<img src="${productImageUrl}" alt="${productName}" width="200" />` : ''}
          <p>Order now before it runs out.</p>
        `,
      });
    }
  }
}

@Processor(PASSWORD_RESET_QUEUE)
export class PasswordResetProcessor extends WorkerHost {
  private readonly logger = new Logger(PasswordResetProcessor.name);

  constructor(private readonly mailer: MailerService) {
    super();
  }

  async process(job: Job<PasswordResetJobData>): Promise<void> {
    const { email, resetToken, expiresAt } = job.data;

    await this.mailer.sendMail({
      to: email,
      subject: 'Password reset request',
      html: `
        <h2>Password Reset</h2>
        <p>Use the token below to reset your password. It expires at ${new Date(expiresAt).toLocaleString()}.</p>
        <code>${resetToken}</code>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    });
  }
}
