import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import {
  Category,
  ManagerProduct,
  Product,
  ProductImage,
  ProductWithDetails,
} from './models/product.model';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductFilterInput } from './dto/product-filter.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../common/casl/policies.guard';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { Action } from '../common/casl/casl-ability.factory';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UploadImageInput } from './dto/upload-image.input';
import { ImageUploadService } from 'src/common/services/image-upload.service';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(
    private productsService: ProductsService,
    private imageUploadService: ImageUploadService,
  ) {}

  @Query(() => [ProductWithDetails])
  async products(
    @Args('filter', { nullable: true }) filter?: ProductFilterInput,
  ) {
    const products = await this.productsService.findAll(filter ?? {});
    return products;
  }

  @Query(() => ProductWithDetails)
  productDetail(
    @Args({ name: 'productId', type: () => ID }) productId: string,
  ) {
    return this.productsService.findOne(productId);
  }

  @Query(() => [ManagerProduct])
  @UseGuards(JwtAuthGuard /*, PoliciesGuard*/)
  //@CheckPolicies((ability) => ability.can(Action.Create, 'Product'))
  async managerProducts(
    @CurrentUser() user: { userId: string },
    @Args('filter', { nullable: true }) filter?: ProductFilterInput,
  ): Promise<ManagerProduct[]> {
    return this.productsService.getByManagerId(user.userId, filter ?? {});
  }

  @Query(() => [Category])
  productCategories() {
    return this.productsService.getCategories();
  }

  @Mutation(() => ManagerProduct)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Product'))
  async createProduct(
    @Args('input') input: CreateProductInput,
    @CurrentUser() user: { userId: string },
  ): Promise<ManagerProduct> {
    const product = await this.productsService.create(input, user.userId);
    return product;
  }

  @Mutation(() => ManagerProduct)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Product'))
  async updateProduct(
    @Args({ name: 'productId', type: () => ID }) productId: string,
    @Args('input') input: UpdateProductInput,
    @CurrentUser() user: { userId: string },
  ): Promise<ManagerProduct> {
    return this.productsService.update(productId, input, user.userId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Product'))
  async deleteProduct(
    @Args({ name: 'productId', type: () => ID }) productId: string,
  ): Promise<boolean> {
    return this.productsService.delete(productId);
  }

  @Mutation(() => ProductImage)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Image'))
  async uploadProductImage(
    @Args('productId') productId: string,
    @Args('input') input: UploadImageInput,
  ): Promise<ProductImage> {
    //TODO: Upload image resolver logic
    const stream = input.file.createReadStream();
    const imageUrl = await this.imageUploadService.UploadImage(
      stream,
      input.file.mimetype,
    );
    return this.productsService.createImage(productId, imageUrl);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Image'))
  async deleteProductImage(
    @Args({ name: 'imageId', type: () => ID }) imageId: string,
  ): Promise<boolean> {
    //TODO: Delete image resolver logic
    return this.productsService.deleteImage(imageId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Like, 'Product'))
  toggleLike(
    @Args({ name: 'productId', type: () => ID }) productId: string,
    @Args('likeStatus') likeStatus: boolean,
    @CurrentUser() user: { userId: string },
  ) {
    return this.productsService.toggleLike(productId, user.userId, likeStatus);
  }
}
