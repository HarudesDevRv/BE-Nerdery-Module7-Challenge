import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { OrderItem } from '../models/order.model';
import { buildOrderItemSelect } from '../utils/order-item-field-map';

type RawOrderItem = {
  orderId: string;
  inventoryId?: string;
  amount?: number;
  price?: { toNumber(): number };
  products?: { product?: { name?: string } } | null;
};

@Injectable()
export class OrderItemsLoader {
  constructor(private prisma: PrismaService) {}

  createLoader(requestedFields: string[]) {
    const select = buildOrderItemSelect(requestedFields);

    return new DataLoader<string, OrderItem[]>(
      async (orderIds: readonly string[]) => {
        const products = (
          await this.prisma.orderProduct.findMany({
            where: { orderId: { in: [...orderIds] } },
            select,
          })
        ).map((item) => {
          const raw = item as unknown as RawOrderItem;
          return {
            orderId: raw.orderId,
            inventoryId: raw.inventoryId,
            amount: raw.amount,
            price: raw.price?.toNumber(),
            productName: raw.products?.product?.name,
          };
        });

        return orderIds.map(
          (id) =>
            products.filter(
              (item) => item.orderId === id,
            ) as unknown as OrderItem[],
        );
      },
    );
  }
}
