import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './services/products.service';
import { S3Service } from 'src/common/services/s3/s3.service';
import { ProductMapperService } from './services/product-mapper.service';

@Module({
  providers: [
    ProductsResolver,
    ProductsService,
    S3Service,
    ProductMapperService,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
