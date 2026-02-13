import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './services/products.service';
import { UploadScalar } from './models/upload.scalar';
import { ImageUploadService } from 'src/common/services/image-upload.service';
import { ProductUtilityService } from './services/product-utility.service';

@Module({
  providers: [
    ProductsResolver,
    ProductsService,
    UploadScalar,
    ImageUploadService,
    ProductUtilityService,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
