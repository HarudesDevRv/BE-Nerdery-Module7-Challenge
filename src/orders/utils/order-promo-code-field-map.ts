import { Prisma } from '@prisma/client';
import {
  buildSelect,
  FieldMapConfig,
} from '../../common/utils/prisma-field-mapper';

const ORDER_PROMO_CODE_FIELD_CONFIG: FieldMapConfig<Prisma.OrderDiscountCodesSelect> =
  {
    // orderId is not a GQL field on OrderPromoCode, but is always needed
    // to correlate batch results back to their parent order.
    mandatory: { orderId: true },

    // All three GQL fields live inside the discountCodes relation.
    // Deep merge in buildSelect combines their individual select entries
    // so requesting any subset produces a single correct nested select.
    fieldMap: {
      code: { discountCodes: { select: { code: true } } },
      discountType: { discountCodes: { select: { discountType: true } } },
      discountValue: { discountCodes: { select: { discountValue: true } } },
    },

    resolveFields: new Set(),
  };

export function buildOrderPromoCodeSelect(
  requestedFields: string[],
): Prisma.OrderDiscountCodesSelect {
  return buildSelect(
    requestedFields,
    ORDER_PROMO_CODE_FIELD_CONFIG,
  ) as Prisma.OrderDiscountCodesSelect;
}
