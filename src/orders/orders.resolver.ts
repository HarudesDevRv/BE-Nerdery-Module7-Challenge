import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order, OrderItem, OrderPromoCode } from './models/order.model';
import { CreateOrderInput } from './dto/create-order.input';
import { CreateSingleItemOrderInput } from './dto/create-single-item-order.input';
import { OrderFilterInput } from './dto/order-filter.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../common/casl/policies.guard';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { Action } from '../common/casl/casl-ability.factory';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import DataLoader from 'dataloader';

@Resolver(() => Order)
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class OrdersResolver {
  constructor(private ordersService: OrdersService) {}

  @Query(() => [Order])
  @CheckPolicies((ability) => ability.can(Action.Manage, 'Order'))
  async allOrders(
    @Args('filter', { nullable: true }) filter?: OrderFilterInput,
  ) {
    return this.ordersService.findAll(filter ?? {});
  }

  @Query(() => [Order])
  @CheckPolicies((ability) => ability.can(Action.Read, 'Order'))
  async myOrders(
    @CurrentUser() user: { userId: string },
    @Args('filter', { nullable: true }) filter?: OrderFilterInput,
  ) {
    return this.ordersService.findAllByUser(user.userId, filter ?? {});
  }

  @Query(() => Order)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Order'))
  async orderDetail(
    @Args({ name: 'orderId', type: () => ID }) orderId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.ordersService.findOne(orderId, user.userId);
  }

  @Mutation(() => Order)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Order'))
  async createOrder(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateOrderInput,
  ) {
    return this.ordersService.create(user.userId, input);
  }

  @Mutation(() => Order)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Order'))
  async createSingleItemOrder(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateSingleItemOrderInput,
  ) {
    return this.ordersService.createSingleItemOrder(user.userId, input);
  }

  @ResolveField(() => [OrderItem])
  async items(
    @Parent() order: Order,
    @Context('orderItemsLoader') loader: DataLoader<string, OrderItem[]>,
  ) {
    return loader.load(order.orderId);
  }

  @ResolveField(() => [OrderPromoCode])
  async promoCodes(
    @Parent() order: Order,
    @Context('orderPromoCodesLoader')
    loader: DataLoader<string, OrderPromoCode[]>,
  ) {
    return loader.load(order.orderId);
  }
}
