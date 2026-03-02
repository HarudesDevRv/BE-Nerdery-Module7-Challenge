import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { OrdersService } from '../services/orders.service';
import { Order } from '../models/order.model';
import { CreateGuestOrderInput } from '../dto/create-guest-order.input';

/**
 * Handles order mutations that do not require authentication.
 * Authenticated order operations live in OrdersResolver.
 */
@Resolver(() => Order)
export class GuestOrdersResolver {
  constructor(private ordersService: OrdersService) {}

  @Mutation(() => Order)
  async createGuestOrder(@Args('input') input: CreateGuestOrderInput) {
    return this.ordersService.createGuestOrder(input);
  }
}
