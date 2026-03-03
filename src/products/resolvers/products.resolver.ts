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
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CheckPolicies } from 'src/common/casl/check-policies.decorator';
import { Action } from 'src/common/casl/casl-ability.factory';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@Resolver(() => ProductWithDetails)
export class ProductsResolver {
  constructor(private productsService: ProductsService) {}

  @Query(() => [Category])
  @Public()
  productCategories(): Promise<Partial<Category>[]> {
    return this.productsService.getCategories();
  }

  @Query(() => ProductsPage)
  @Public()
  async products(
    @Args('filter', { nullable: true }) filter?: ProductFilterInput,
  ): Promise<ProductsPage> {
    return this.productsService.findAll(filter ?? {});
  }

  @Query(() => ProductWithDetails)
  @Public()
  productDetail(
    @Args({ name: 'productId', type: () => ID }) productId: string,
  ): Promise<Partial<ProductWithDetails>> {
    return this.productsService.findOne(productId);
  }

  @Mutation(() => Boolean)
  @UseGuards(PoliciesGuard)
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
    @Context('imagesLoader') loader: DataLoader<string, ProductImage[]>,
  ): Promise<Partial<ProductImage>[]> {
    return loader.load(product.productId);
  }
}
