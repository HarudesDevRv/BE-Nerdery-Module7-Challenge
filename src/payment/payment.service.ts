import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async createPaymentIntent(_dto: CreatePaymentDto) {
    // TODO: create Stripe PaymentIntent and store in DB
  }

  async handleWebhook(_payload: Buffer, _signature: string) {
    // TODO: verify Stripe signature and process webhook event
  }
}
