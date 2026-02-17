import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { DiscountType } from '@prisma/client';
import { Order } from './models/order.model';

type OrderProduct = {
  inventoryId: string;
  amount: number;
  price: Decimal;
  products: { product: { name: string } };
};

type OrderDiscountCode = {
  discountCodes: {
    code: string;
    discountType: DiscountType;
    discountValue: Decimal;
  };
};

type RawOrder = {
  orderId: string;
  paymentId: string | null;
  subtotal: Decimal;
  total: Decimal;
  products: OrderProduct[];
  discountCodes: OrderDiscountCode[];
  createdAt: Date;
  updatedAt: Date;
};

type CartProduct = {
  inventoryId: string;
  amount: number;
  inventory: { price: Decimal; product: { name: string } };
};

type CreatedOrder = {
  orderId: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class OrderUtilsService {
  formatOrder(order: RawOrder): Order {
    return {
      orderId: order.orderId,
      paymentId: order.paymentId ? order.paymentId : undefined,
      items: order.products.map((item) => ({
        inventoryId: item.inventoryId,
        amount: item.amount,
        price: item.price.toNumber(),
        productName: item.products.product.name,
      })),
      subtotal: order.subtotal.toNumber(),
      total: order.total.toNumber(),
      promoCodes:
        order.discountCodes.length > 0
          ? order.discountCodes.map((code) => ({
              code: code.discountCodes.code,
              discountType: code.discountCodes.discountType,
              discountValue: code.discountCodes.discountValue.toNumber(),
            }))
          : undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  formatCreatedOrder(
    order: CreatedOrder,
    cartProducts: CartProduct[],
    subtotal: number,
    total: number,
  ): Order {
    return {
      orderId: order.orderId,
      subtotal,
      total,
      items: cartProducts.map((item) => ({
        inventoryId: item.inventoryId,
        productName: item.inventory.product.name,
        amount: item.amount,
        price: item.inventory.price.toNumber(),
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
