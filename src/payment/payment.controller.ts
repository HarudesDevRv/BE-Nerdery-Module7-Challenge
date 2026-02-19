import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/req/create-payment-intent.dto';
import { CreateCheckoutSessionDto } from './dto/req/create-checkout-session.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('payment-intent')
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.paymentService.createPaymentIntent(dto);
  }

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  createCheckoutSession(@Body() dto: CreateCheckoutSessionDto) {
    return this.paymentService.createCheckoutSession(dto);
  }
}
