import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './services/products.service';
import { ImageUploadService } from 'src/common/services/s3/image-upload.service';
import { ProductMapperService } from './services/product-mapper.service';

@Module({
  providers: [
    ProductsResolver,
    ProductsService,
    ImageUploadService,
    ProductMapperService,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
