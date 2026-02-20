import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { LOW_STOCK_QUEUE } from './notifications.module';
import { LowStockJobData } from './notifications.producer';

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
