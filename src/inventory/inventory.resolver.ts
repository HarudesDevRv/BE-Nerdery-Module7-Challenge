import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Inventory } from '../products/models/manager-product.model';
import { Store } from './models/store.model';
import { CreateInventoryInput } from './dto/create-inventory.input';
import { UpdateInventoryInput } from './dto/update-inventory.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../common/casl/policies.guard';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { Action } from '../common/casl/casl-ability.factory';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@CheckPolicies((ability) => ability.can(Action.Update, 'Product'))
export class InventoryResolver {
  constructor(private inventoryService: InventoryService) {}

  @Query(() => [Store])
  async getStores() {
    return this.inventoryService.getStores();
  }

  @Mutation(() => Inventory)
  async addInventory(
    @Args('input') input: CreateInventoryInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.inventoryService.addInventory(input, user.userId);
  }

  @Mutation(() => Inventory)
  async updateInventory(
    @Args({ name: 'inventoryId', type: () => ID }) inventoryId: string,
    @Args('input') input: UpdateInventoryInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.inventoryService.updateInventory(
      inventoryId,
      input,
      user.userId,
    );
  }

  @Mutation(() => Boolean)
  async removeInventory(
    @Args({ name: 'inventoryId', type: () => ID }) inventoryId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.inventoryService.removeInventory(inventoryId, user.userId);
  }
}
