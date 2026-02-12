import { Module } from '@nestjs/common';
import { ImageUploadService } from 'src/common/services/image-upload.service';

@Module({
  providers: [ImageUploadService],
  exports: [ImageUploadService],
})
export class ImageUploadModule {}
