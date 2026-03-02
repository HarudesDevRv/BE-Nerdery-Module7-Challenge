import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';
import { Order } from '../models/order.model';

type RawOrder = {
  userId: string;
  orderId: string;
  paymentId?: string | null;
  subtotal?: Decimal;
  total?: Decimal;
  createdAt?: Date;
  updatedAt?: Date;
  status?: OrderStatus;
  payment?: { paymentMethod: string | null } | null;
};

type CreatedOrder = {
  orderId: string;
  guestEmail?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class OrderMapperService {
  formatOrder(order: RawOrder): Partial<Order> {
    return {
      orderId: order.orderId,
      paymentId: order.paymentId ?? undefined,
      paymentMethod: order.payment?.paymentMethod ?? undefined,
      subtotal: order.subtotal?.toNumber(),
      total: order.total?.toNumber(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      status: order.status,
    };
  }

  formatCreatedOrder(order: CreatedOrder, subtotal: number): Partial<Order> {
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
