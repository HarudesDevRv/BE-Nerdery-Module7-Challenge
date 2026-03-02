import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { DiscountType } from '@prisma/client';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { OrderPromoCode } from '../models/order.model';
import { buildOrderPromoCodeSelect } from '../utils/order-promo-code-field-map';

type RawOrderDiscountCode = {
  orderId: string;
  discountCodes?: {
    code?: string;
    discountType?: DiscountType;
    discountValue?: { toNumber(): number };
  } | null;
};

@Injectable()
export class OrderPromoCodesLoader {
  constructor(private prisma: PrismaService) {}

  createLoader(requestedFields: string[]) {
    const select = buildOrderPromoCodeSelect(requestedFields);

    return new DataLoader<string, OrderPromoCode[]>(
      async (orderIds: readonly string[]) => {
        const promoCodes = (
          await this.prisma.orderDiscountCodes.findMany({
            where: { orderId: { in: [...orderIds] } },
            select,
          })
        ).map((code) => {
          const raw = code as unknown as RawOrderDiscountCode;
          return {
            orderId: raw.orderId,
            code: raw.discountCodes?.code,
            discountType: raw.discountCodes?.discountType,
            discountValue: raw.discountCodes?.discountValue?.toNumber(),
          };
        });

        return orderIds.map(
          (id) =>
            promoCodes.filter(
              (entry) => entry.orderId === id,
            ) as unknown as OrderPromoCode[],
        );
      },
    );
  }
}
