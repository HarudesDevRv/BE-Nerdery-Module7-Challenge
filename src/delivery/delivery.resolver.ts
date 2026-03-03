import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { Delivery } from './models/delivery.model';
import { UpdateDeliveryInput } from './dto/update-delivery.input';
import { PoliciesGuard } from '../common/casl/policies.guard';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { Action } from '../common/casl/casl-ability.factory';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver(() => Delivery)
@UseGuards(PoliciesGuard)
export class DeliveryResolver {
  constructor(private deliveryService: DeliveryService) {}

  @Query(() => Delivery)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Delivery'))
  deliveryByOrder(@Args('orderId') orderId: string): Promise<Delivery> {
    return this.deliveryService.findByOrder(orderId);
  }

  @Query(() => [Delivery])
  @CheckPolicies((ability) => ability.can(Action.Read, 'Delivery'))
  myDeliveries(@CurrentUser() user: { userId: string }): Promise<Delivery[]> {
    return this.deliveryService.findAssigned(user.userId);
  }

  @Mutation(() => Delivery)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Delivery'))
  updateDeliveryStatus(
    @Args({ name: 'deliveryId', type: () => ID }) deliveryId: string,
    @Args('input') input: UpdateDeliveryInput,
  ): Promise<Delivery> {
    return this.deliveryService.updateStatus(deliveryId, input);
  }

  @Mutation(() => Delivery)
  @CheckPolicies((ability) => ability.can(Action.Manage, 'Delivery'))
  assignDelivery(
    @Args({ name: 'deliveryId', type: () => ID }) deliveryId: string,
    @CurrentUser() user: { userId: string },
  ): Promise<Delivery> {
    return this.deliveryService.assign(deliveryId, user.userId);
  }

  @Mutation(() => Delivery)
  @CheckPolicies((ability) => ability.can(Action.Manage, 'Delivery'))
  completeDelivery(
    @Args({ name: 'deliveryId', type: () => ID }) deliveryId: string,
    @Args({ name: 'deliveryPersonId', type: () => ID })
    deliveryPersonId: string,
  ): Promise<Delivery> {
    return this.deliveryService.completeDelivery(deliveryId, deliveryPersonId);
  }
}
