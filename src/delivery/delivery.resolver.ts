import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { Delivery } from './models/delivery.model';
import { UpdateDeliveryInput } from './dto/update-delivery.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../common/casl/policies.guard';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { Action } from '../common/casl/casl-ability.factory';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver(() => Delivery)
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class DeliveryResolver {
  constructor(private deliveryService: DeliveryService) {}

  @Query(() => Delivery)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Delivery'))
  deliveryByOrder(@Args('orderId') orderId: string) {
    return this.deliveryService.findByOrder(orderId);
  }

  @Query(() => [Delivery])
  @CheckPolicies((ability) => ability.can(Action.Read, 'Delivery'))
  myDeliveries(@CurrentUser() user: { userId: string }) {
    return this.deliveryService.findAssigned(user.userId);
  }

  @Mutation(() => Delivery)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Delivery'))
  updateDeliveryStatus(
    @Args('deliveryId') deliveryId: string,
    @Args('input') input: UpdateDeliveryInput,
  ) {
    return this.deliveryService.updateStatus(deliveryId, input);
  }

  @Mutation(() => Delivery)
  @CheckPolicies((ability) => ability.can(Action.Manage, 'Delivery'))
  assignDelivery(
    @Args('deliveryId') deliveryId: string,
    @Args('deliveryPersonId') deliveryPersonId: string,
  ) {
    return this.deliveryService.assign(deliveryId, deliveryPersonId);
  }
}
