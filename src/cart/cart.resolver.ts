import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CartService } from './services/cart.service';
import { Cart } from './models/cart.model';
import { AddToCartInput } from './dto/add-to-cart.input';
import { UpdateCartItemInput } from './dto/update-cart-item.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../common/casl/policies.guard';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { Action } from '../common/casl/casl-ability.factory';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver(() => Cart)
@UseGuards(JwtAuthGuard, PoliciesGuard)
@CheckPolicies((ability) => ability.can(Action.Manage, 'Cart'))
export class CartResolver {
  constructor(private cartService: CartService) {}

  @Query(() => Cart)
  myCart(@CurrentUser() user: { userId: string }): Promise<Cart> {
    return this.cartService.getCart(user.userId);
  }

  @Mutation(() => Cart)
  addToCart(
    @CurrentUser() user: { userId: string },
    @Args('input') input: AddToCartInput,
  ): Promise<Cart> {
    return this.cartService.addItem(user.userId, input);
  }

  @Mutation(() => Cart)
  updateCartItem(
    @CurrentUser() user: { userId: string },
    @Args('input') input: UpdateCartItemInput,
  ): Promise<Cart> {
    return this.cartService.updateItem(user.userId, input);
  }

  @Mutation(() => Cart)
  removeCartItem(
    @CurrentUser() user: { userId: string },
    @Args({ name: 'inventoryId', type: () => ID }) inventoryId: string,
  ): Promise<Cart> {
    return this.cartService.removeItem(user.userId, inventoryId);
  }

  @Mutation(() => Boolean)
  clearCart(@CurrentUser() user: { userId: string }): Promise<boolean> {
    return this.cartService.clearCart(user.userId);
  }
}
