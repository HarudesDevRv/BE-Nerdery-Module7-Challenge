import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';

type RawOrder = {
  orderId: string;
  paymentId: string | null;
  subtotal: Decimal;
  total: Decimal;
  createdAt: Date;
  updatedAt: Date;
};

type CreatedOrder = {
  orderId: string;
  guestEmail?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class OrderUtilsService {
  formatOrder(order: RawOrder) {
    return {
      orderId: order.orderId,
      paymentId: order.paymentId ?? undefined,
      subtotal: order.subtotal.toNumber(),
      total: order.total.toNumber(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  formatCreatedOrder(order: CreatedOrder, subtotal: number) {
    return {
      orderId: order.orderId,
      ...(order.guestEmail && { guestEmail: order.guestEmail }),
      subtotal,
      total: subtotal,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
