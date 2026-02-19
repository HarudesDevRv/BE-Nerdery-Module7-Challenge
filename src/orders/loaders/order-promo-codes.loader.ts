import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { OrderPromoCode } from '../models/order.model';

@Injectable()
export class OrderPromoCodesLoader {
  constructor(private prisma: PrismaService) {}

  createLoader() {
    return new DataLoader<string, OrderPromoCode[]>(
      async (orderIds: readonly string[]) => {
        const promoCodes = (
          await this.prisma.orderDiscountCodes.findMany({
            where: { orderId: { in: [...orderIds] } },
            include: {
              discountCodes: {
                select: { discountType: true, discountValue: true, code: true },
              },
            },
          })
        ).map((code) => ({
          orderId: code.orderId,
          code: code.discountCodes.code,
          discountType: code.discountCodes.discountType,
          discountValue: code.discountCodes.discountValue.toNumber(),
        }));

        const grouped = orderIds.map((id) =>
          promoCodes.filter((orderProduct) => orderProduct.orderId === id),
        );

        return grouped;
      },
    );
  }
}
