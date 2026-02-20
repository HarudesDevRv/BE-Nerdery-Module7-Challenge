import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Delivery {
  @Field(() => ID)
  deliveryId: string;
  orderId: string;
  status: string;
  deliveryPersonId?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
