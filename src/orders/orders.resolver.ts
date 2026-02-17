import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './models/order.model';
import { CreateOrderInput } from './dto/create-order.input';
import { OrderFilterInput } from './dto/order-filter.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../common/casl/policies.guard';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { Action } from '../common/casl/casl-ability.factory';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver(() => Order)
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class OrdersResolver {
  constructor(private ordersService: OrdersService) {}

  @Query(() => [Order])
  @CheckPolicies((ability) => ability.can(Action.Read, 'Order'))
  async myOrders(
    @CurrentUser() user: { userId: string },
    @Args('filter', { nullable: true }) filter?: OrderFilterInput,
  ): Promise<Order[]> {
    return this.ordersService.findAll(user.userId, filter ?? {});
  }

  @Query(() => Order)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Order'))
  orderDetail(
    @Args({ name: 'orderId', type: () => ID }) orderId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.ordersService.findOne(orderId, user.userId);
  }

  @Mutation(() => Order)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Order'))
  createOrder(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateOrderInput,
  ) {
    return this.ordersService.create(user.userId, input);
  }
}
