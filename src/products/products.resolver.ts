import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import {
  ConflictException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
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
import { ImageUploadService } from 'src/common/services/image-upload.service';
import * as graphqlUploadTs from 'graphql-upload-ts';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(
    private productsService: ProductsService,
    private imageUploadService: ImageUploadService,
  ) {}

  @Query(() => [Category])
  productCategories() {
    return this.productsService.getCategories();
  }

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
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Product'))
  async managerProducts(
    @CurrentUser() user: { userId: string },
    @Args('filter', { nullable: true }) filter?: ProductFilterInput,
  ): Promise<ManagerProduct[]> {
    return this.productsService.getByManagerId(user.userId, filter ?? {});
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
    @CurrentUser() user: { userId: string },
  ): Promise<boolean> {
    return this.productsService.delete(productId, user.userId);
  }

  @Mutation(() => ProductImage)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Image'))
  async uploadProductImage(
    @Args({ name: 'productId', type: () => ID }) productId: string,
    @Args({ name: 'file', type: () => graphqlUploadTs.GraphQLUpload })
    file: graphqlUploadTs.FileUpload,
    @CurrentUser() user: { userId: string },
  ): Promise<ProductImage | null> {
    let databaseImage: ProductImage | null = null;

    try {
      databaseImage = await this.productsService.createImage(
        productId,
        null,
        user.userId,
      );

      if (file.mimetype.substring(0, file.mimetype.indexOf('/')) != 'image') {
        throw new ConflictException('The file should be an image');
      }

      const uploadKey = `products/${productId}/images/${databaseImage.imageId}`;
      const imageUrl = await this.imageUploadService.UploadImage(
        file,
        uploadKey,
      );

      const uploadedImage = await this.productsService.updateImageUrl(
        databaseImage.imageId,
        imageUrl,
        user.userId,
      );

      return uploadedImage;
    } catch (error) {
      if (databaseImage?.imageId) {
        await this.productsService.deleteImage(
          databaseImage.imageId,
          user.userId,
        );
        throw error;
      } else {
        throw new InternalServerErrorException('Could not upload the image');
      }
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Image'))
  async deleteProductImage(
    @Args({ name: 'imageId', type: () => ID }) imageId: string,
    @CurrentUser() user: { userId: string },
  ): Promise<boolean> {
    const deletedImage = await this.productsService.deleteImage(
      imageId,
      user.userId,
    );

    if (!deletedImage.url) {
      throw new InternalServerErrorException(
        'There was a problem deleting the image',
      );
    }

    const imageUrl = deletedImage.url.substring(
      deletedImage.url?.indexOf('/products') + 1,
    );

    await this.imageUploadService.DeleteImage(imageUrl);

    return true;
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
}
