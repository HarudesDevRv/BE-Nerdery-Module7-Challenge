import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Delivery {
  @Field(() => ID)
  deliveryId: string;

  @Field()
  orderId: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  deliveryPersonId?: string;

  @Field({ nullable: true })
  estimatedDelivery?: Date;

  @Field({ nullable: true })
  deliveredAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
