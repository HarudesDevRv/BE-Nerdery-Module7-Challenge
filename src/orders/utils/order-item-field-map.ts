import { Prisma } from '@prisma/client';
import {
  buildSelect,
  FieldMapConfig,
} from '../../common/utils/prisma-field-mapper';

const ORDER_ITEM_FIELD_CONFIG: FieldMapConfig<Prisma.OrderProductSelect> = {
  // orderId is not a GQL field on OrderItem, but is always needed
  // to correlate batch results back to their parent order.
  mandatory: { orderId: true },

  fieldMap: {
    inventoryId: { inventoryId: true },
    amount: { amount: true },
    price: { price: true },
    // productName requires a two-level join: OrderProduct → Inventory → Product
    productName: {
      products: { select: { product: { select: { name: true } } } },
    },
  },

  resolveFields: new Set(),
};

export function buildOrderItemSelect(
  requestedFields: string[],
): Prisma.OrderProductSelect {
  return buildSelect(
    requestedFields,
    ORDER_ITEM_FIELD_CONFIG,
  ) as Prisma.OrderProductSelect;
}
