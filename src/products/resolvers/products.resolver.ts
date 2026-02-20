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
import { ProductsService } from '../services/products.service';
import { Category, Product, ProductImage } from '../models/product.model';
import { ProductFilterInput } from '../dto/product-filter.input';
import {
  ProductWithDetails,
  ProductsPage,
} from '../models/product-detail.model';
import DataLoader from 'dataloader';
import { Image } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CheckPolicies } from 'src/common/casl/check-policies.decorator';
import { Action } from 'src/common/casl/casl-ability.factory';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Resolver(() => ProductWithDetails)
export class ProductsResolver {
  constructor(private productsService: ProductsService) {}

  @Query(() => [Category])
  productCategories() {
    return this.productsService.getCategories();
  }

  @Query(() => ProductsPage)
  async products(
    @Args('filter', { nullable: true }) filter?: ProductFilterInput,
  ) {
    return this.productsService.findAll(filter ?? {});
  }

  @Query(() => ProductWithDetails)
  productDetail(
    @Args({ name: 'productId', type: () => ID }) productId: string,
  ) {
    return this.productsService.findOne(productId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Like, 'Product'))
  async toggleLike(
    @Args({ name: 'productId', type: () => ID }) productId: string,
    @Args('likeStatus') likeStatus: boolean,
    @CurrentUser() user: { userId: string },
  ): Promise<boolean> {
    return this.productsService.toggleLike(productId, user.userId, likeStatus);
  }

  @ResolveField(() => [ProductImage])
  async images(
    @Parent() product: Product,
    @Context('imagesLoader') loader: DataLoader<string, Image[]>,
  ) {
    return loader.load(product.productId);
  }
}
