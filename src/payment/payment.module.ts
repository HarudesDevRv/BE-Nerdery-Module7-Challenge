import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { StripeService } from 'src/common/services/stripe/stripe.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PaymentSucceededListener } from './listeners/payment-succeeded.listener';

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentController],
  providers: [PaymentService, StripeService, PaymentSucceededListener],
  exports: [PaymentService],
})
export class PaymentModule {}
