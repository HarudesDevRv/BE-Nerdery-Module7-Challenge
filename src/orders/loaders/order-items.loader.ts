import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { OrderItem } from '../models/order.model';

@Injectable()
export class OrderItemsLoader {
  constructor(private prisma: PrismaService) {}

  createLoader() {
    return new DataLoader<string, OrderItem[]>(
      async (orderIds: readonly string[]) => {
        const products = (
          await this.prisma.orderProduct.findMany({
            where: { orderId: { in: [...orderIds] } },
            include: { products: { include: { product: true } } },
          })
        ).map((item) => ({
          orderId: item.orderId,
          inventoryId: item.inventoryId,
          amount: item.amount,
          price: item.price.toNumber(),
          productName: item.products.product.name,
        }));

        const grouped = orderIds.map((id) =>
          products.filter((orderProduct) => orderProduct.orderId === id),
        );

        return grouped;
      },
    );
  }
}
