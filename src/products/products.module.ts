import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './services/products.service';
import { S3Service } from 'src/common/services/s3/s3.service';
import { ProductMapperService } from './services/product-mapper.service';
import { ManagerProductResolver } from './manager-products.resolver';
import { ProductImageLoader } from './loaders/product-image.loader';
import { ProductInventoryLoader } from './loaders/product-inventory.loader';

@Module({
  providers: [
    ProductsResolver,
    ManagerProductResolver,
    ProductsService,
    S3Service,
    ProductMapperService,
    ProductImageLoader,
    ProductInventoryLoader,
  ],
  exports: [ProductsService, ProductImageLoader, ProductInventoryLoader],
})
export class ProductsModule {}
