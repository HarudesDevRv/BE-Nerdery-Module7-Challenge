import { Delivery, DeliveryStatus, Role, User } from '@prisma/client';
import { UpdateDeliveryInput } from './dto/update-delivery.input';

export const fakeDelivery: Partial<Delivery> = {
  deliveryId: 'did1',
  orderId: 'oid1',
  deliveryPersonId: null,
  status: DeliveryStatus.pending,
  estimatedAt: null,
};

export const fakeDeliveryWithOrder = {
  ...fakeDelivery,
  order: { orderId: 'oid1', status: 'processing' },
};

export const fakeDeliveryWithNonProcessingOrder = {
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
