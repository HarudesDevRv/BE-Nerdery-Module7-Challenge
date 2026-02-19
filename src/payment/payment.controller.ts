import {
  Body,
  Controller,
  // Headers,
  Post,
  // RawBody,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.paymentService.createPaymentIntent(dto);
  }

  // @Post('webhook')
  // handleWebhook(
  //   @RawBody() payload: Buffer,
  //   @Headers('stripe-signature') signature: string,
  // ) {
  //   return this.paymentService.handleWebhook(payload, signature);
  // }
}
