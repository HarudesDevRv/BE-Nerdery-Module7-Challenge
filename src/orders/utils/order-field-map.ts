import { Prisma } from '@prisma/client';
import {
  buildSelect,
  FieldMapConfig,
} from '../../common/utils/prisma-field-mapper';

const ORDER_FIELD_CONFIG: FieldMapConfig<Prisma.OrderSelect> = {
  // orderId: DataLoader correlation key for items/promoCodes resolvers.
  // userId: required by findOne for the ownership check.
  mandatory: {
    orderId: true,
    userId: true,
  },

  // Only fetched when the matching GQL field is in the selection set.
  // paymentMethod is exposed by the @nestjs/graphql plugin and triggers
  // the payment JOIN only when explicitly requested by the client.
  fieldMap: {
    paymentId: { paymentId: true },
    subtotal: { subtotal: true },
    total: { total: true },
    createdAt: { createdAt: true },
    updatedAt: { updatedAt: true },
    status: { status: true },
    guestEmail: { guestEmail: true },
    paymentMethod: { payment: { select: { paymentMethod: true } } },
  },

  // Handled by DataLoader in @ResolveField — must not appear in the
  // Prisma select or the JOIN would defeat the batching strategy.
  resolveFields: new Set(['items', 'promoCodes']),
};

export function buildOrderSelect(
  requestedFields: string[],
): Prisma.OrderSelect {
  return buildSelect(requestedFields, ORDER_FIELD_CONFIG) as Prisma.OrderSelect;
}
