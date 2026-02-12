import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './products.service';
import { UploadScalar } from './models/upload.scalar';
import { ImageUploadService } from 'src/common/services/image-upload.service';

@Module({
  providers: [
    ProductsResolver,
    ProductsService,
    UploadScalar,
    ImageUploadService,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
