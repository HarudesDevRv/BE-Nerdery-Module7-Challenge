import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { LOW_STOCK_QUEUE, PASSWORD_RESET_QUEUE } from './notifications.constants';
import {
  LowStockJobData,
  PasswordResetJobData,
} from './notifications.producer';

@Processor(LOW_STOCK_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private transporter = nodemailer.createTransport({
    /* your SMTP config */
  });

  async process(job: Job<LowStockJobData>): Promise<void> {
    const { productName, stock, userEmails, productImageUrl } = job.data;

    for (const email of userEmails) {
      await this.transporter.sendMail({
        to: email,
        subject: `Low stock alert: ${productName}`,
        html: `
          <h2>Only ${stock} units of "${productName}" left!</h2>
          ${productImageUrl ? `<img src="${productImageUrl}" alt="${productName}" width="200" />` : ''}
          <p>Order now before it runs out.</p>
        `,
      });
    }

    this.logger.log(
      `Low-stock alert sent to ${userEmails.length} users for "${productName}"`,
    );
  }
}

@Processor(PASSWORD_RESET_QUEUE)
export class PasswordResetProcessor extends WorkerHost {
  private readonly logger = new Logger(PasswordResetProcessor.name);
  private transporter = nodemailer.createTransport({
    /* your SMTP config */
  });

  async process(job: Job<PasswordResetJobData>): Promise<void> {
    const { email, resetToken, expiresAt } = job.data;

    await this.transporter.sendMail({
      to: email,
      subject: 'Password reset request',
      html: `
        <h2>Password Reset</h2>
        <p>Use the token below to reset your password. It expires at ${expiresAt.toLocaleString()}.</p>
        <code>${resetToken}</code>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    });

    this.logger.log(`Password reset email sent to ${email}`);
  }
}
