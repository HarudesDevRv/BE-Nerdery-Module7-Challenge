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
import { OrdersService } from '../services/orders.service';
import { Order, OrderItem, OrderPromoCode } from '../models/order.model';
import { CreateOrderInput } from '../dto/create-order.input';
import { CreateSingleItemOrderInput } from '../dto/create-single-item-order.input';
import { OrderFilterInput } from '../dto/order-filter.input';
import { PoliciesGuard } from '../../common/casl/policies.guard';
import { CheckPolicies } from '../../common/casl/check-policies.decorator';
import { Action } from '../../common/casl/casl-ability.factory';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestedFields } from '../../common/decorators/requested-fields.decorator';
import { OrderItemsLoader } from '../loaders/order-items.loader';
import { OrderPromoCodesLoader } from '../loaders/order-promo-codes.loader';
import DataLoader from 'dataloader';

type OrdersContext = {
  orderItemsLoader: OrderItemsLoader;
  orderPromoCodesLoader: OrderPromoCodesLoader;
  _orderItemsLoader?: DataLoader<string, OrderItem[]>;
  _orderPromoCodesLoader?: DataLoader<string, OrderPromoCode[]>;
};

@Resolver(() => Order)
@UseGuards(PoliciesGuard)
export class OrdersResolver {
  constructor(private ordersService: OrdersService) {}

  @Query(() => [Order])
  @CheckPolicies((ability) => ability.can(Action.Manage, 'Order'))
  async allOrders(
    @RequestedFields() fields: Record<string, unknown>,
    @Args('filter', { nullable: true }) filter?: OrderFilterInput,
  ): Promise<Partial<Order>[]> {
    return this.ordersService.findAll(filter ?? {}, Object.keys(fields));
  }

  @Query(() => [Order])
  @CheckPolicies((ability) => ability.can(Action.Read, 'Order'))
  async myOrders(
    @RequestedFields() fields: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Args('filter', { nullable: true }) filter?: OrderFilterInput,
  ): Promise<Partial<Order>[]> {
    return this.ordersService.findAllByUser(
      user.userId,
      filter ?? {},
      Object.keys(fields),
    );
  }

  @Query(() => Order)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Order'))
  async orderDetail(
    @RequestedFields() fields: Record<string, unknown>,
    @Args({ name: 'orderId', type: () => ID }) orderId: string,
    @CurrentUser() user: { userId: string },
  ): Promise<Partial<Order>> {
    return this.ordersService.findOne(
      orderId,
      user.userId,
      Object.keys(fields),
    );
  }

  @Mutation(() => Order)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Order'))
  async createOrder(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateOrderInput,
  ): Promise<Partial<Order>> {
    return this.ordersService.create(user.userId, input);
  }

  @Mutation(() => Order)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Order'))
  async createSingleItemOrder(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateSingleItemOrderInput,
  ): Promise<Partial<Order>> {
    return this.ordersService.createSingleItemOrder(user.userId, input);
  }

  @Mutation(() => Order)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Order'))
  async processOrder(
    @Args({ name: 'orderId', type: () => ID }) orderId: string,
  ): Promise<Partial<Order>> {
    return this.ordersService.processOrder(orderId);
  }

  @ResolveField(() => [OrderItem])
  async items(
    @Parent() order: Order,
    @RequestedFields() fields: Record<string, unknown>,
    @Context() ctx: OrdersContext,
  ) {
    ctx._orderItemsLoader ??= ctx.orderItemsLoader.createLoader(
      Object.keys(fields),
    );
    return ctx._orderItemsLoader.load(order.orderId);
  }

  @ResolveField(() => [OrderPromoCode])
  async promoCodes(
    @Parent() order: Order,
    @RequestedFields() fields: Record<string, unknown>,
    @Context() ctx: OrdersContext,
  ) {
    ctx._orderPromoCodesLoader ??= ctx.orderPromoCodesLoader.createLoader(
      Object.keys(fields),
    );
    return ctx._orderPromoCodesLoader.load(order.orderId);
  }
}
