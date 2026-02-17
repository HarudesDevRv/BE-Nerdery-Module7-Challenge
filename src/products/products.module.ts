import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './services/products.service';
import { ImageUploadService } from 'src/common/services/image-upload.service';
import { ProductUtilsService } from './services/product-utils.service';

@Module({
  providers: [
    ProductsResolver,
    ProductsService,
    ImageUploadService,
    ProductUtilsService,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
