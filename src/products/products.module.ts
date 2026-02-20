import { Module } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { S3Service } from 'src/common/services/s3/s3.service';
import { ProductMapperService } from './services/product-mapper.service';
import { ProductImageLoader } from './loaders/product-image.loader';
import { ProductInventoryLoader } from './loaders/product-inventory.loader';
import { ProductsResolver } from './resolvers/products.resolver';
import { ManagerProductResolver } from './resolvers/manager-products.resolver';

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
