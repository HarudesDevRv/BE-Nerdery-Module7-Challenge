import { Delivery, DeliveryStatus, Order, Role, User } from '@prisma/client';
import { UpdateDeliveryInput } from './dto/update-delivery.input';

type DeliveryWithOrder = Partial<Delivery> & {
  order: Partial<Order>;
};

export const fakeDelivery: Partial<Delivery> = {
  deliveryId: 'did1',
  orderId: 'oid1',
  deliveryPersonId: null,
  status: DeliveryStatus.pending,
  estimatedAt: null,
};

export const fakeDeliveryWithOrder: DeliveryWithOrder = {
  ...fakeDelivery,
  order: { orderId: 'oid1', status: 'processing' },
};

export const fakeDeliveryWithNonProcessingOrder: DeliveryWithOrder = {
  ...fakeDelivery,
  order: { orderId: 'oid1', status: 'shipped' },
};

export const fakeDeliveryPerson: Partial<User> = {
  userId: 'dpid1',
  role: Role.delivery_person,
};

export const fakeRegularUser: Partial<User> = {
  userId: 'uid1',
  role: Role.client,
};

export const updateDeliveryInput: UpdateDeliveryInput = {
  status: DeliveryStatus.delivered,
  estimatedDelivery: new Date('2025-12-01'),
};
