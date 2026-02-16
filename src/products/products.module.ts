import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './services/products.service';
import { ImageUploadService } from 'src/common/services/image-upload.service';
import { ProductUtilityService } from './services/product-utility.service';

@Module({
  providers: [
    ProductsResolver,
    ProductsService,
    ImageUploadService,
    ProductUtilityService,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
