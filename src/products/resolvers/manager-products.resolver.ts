import {
  Args,
  Query,
  Resolver,
  Mutation,
  ID,
  Parent,
  ResolveField,
  Context,
} from '@nestjs/graphql';
import {
  Inventory,
  ManagerProduct,
  ManagerProductsPage,
} from '../models/manager-product.model';
import {
  ConflictException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CheckPolicies } from 'src/common/casl/check-policies.decorator';
import { Action } from 'src/common/casl/casl-ability.factory';
import { ProductFilterInput } from '../dto/product-filter.input';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ProductsService } from '../services/products.service';
import { S3Service } from 'src/common/services/s3/s3.service';
import { CreateProductInput } from '../dto/create-product.input';
import { UpdateProductInput } from '../dto/update-product.input';
import { ProductImage } from '../models/product.model';
import * as graphqlUploadTs from 'graphql-upload-ts';
import DataLoader from 'dataloader';
import { Image } from '@prisma/client';

@Resolver(() => ManagerProduct)
export class ManagerProductResolver {
  constructor(
    private productsService: ProductsService,
    private s3Service: S3Service,
  ) {}
  @Query(() => ManagerProductsPage)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Product'))
  async managerProducts(
    @CurrentUser() user: { userId: string },
    @Args('filter', { nullable: true }) filter?: ProductFilterInput,
  ) {
    return this.productsService.getByManagerId(user.userId, filter ?? {});
  }

  @Mutation(() => ManagerProduct)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Product'))
  async createProduct(
    @Args('input') input: CreateProductInput,
    @CurrentUser() user: { userId: string },
  ) {
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
  ) {
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
      const imageUrl = await this.s3Service.UploadImage(file, uploadKey);

      if (!imageUrl) {
        throw new Error('Product image upload failed');
      }

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

    await this.s3Service.DeleteImage(imageUrl);

    return true;
  }

  @ResolveField(() => [Inventory])
  async inventories(
    @Parent() product: ManagerProduct,
    @Context('inventoriesLoader') loader: DataLoader<string, Inventory[]>,
  ) {
    return loader.load(product.productId);
  }

  @ResolveField(() => [ProductImage])
  async images(
    @Parent() product: ManagerProduct,
    @Context('imagesLoader') loader: DataLoader<string, Image[]>,
  ) {
    return loader.load(product.productId);
  }
}
