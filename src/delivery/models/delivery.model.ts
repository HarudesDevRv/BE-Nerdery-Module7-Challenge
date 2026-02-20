import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { DeliveryStatus } from '@prisma/client';

registerEnumType(DeliveryStatus, { name: 'DeliveryStatus' });

@ObjectType()
export class Delivery {
  @Field(() => ID)
  deliveryId: string;
  orderId: string;
  @Field(() => DeliveryStatus)
  status: DeliveryStatus;
  deliveryPersonId?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
