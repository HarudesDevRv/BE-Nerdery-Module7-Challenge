import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { DeliveryStatus } from '@prisma/client';

registerEnumType(DeliveryStatus, { name: 'DeliveryStatus' });

@ObjectType()
export class Delivery {
  @Field(() => ID)
  readonly deliveryId: string;

  @Field(() => ID)
  readonly orderId: string;

  @Field(() => DeliveryStatus)
  readonly status: DeliveryStatus;

  readonly deliveryPersonId?: string;

  readonly estimatedDelivery?: Date;

  readonly deliveredAt?: Date;

  readonly createdAt: Date;

  readonly updatedAt: Date;
}
