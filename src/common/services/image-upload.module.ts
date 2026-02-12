import { Module } from '@nestjs/common';
import { ImageUploadService } from 'src/common/services/image-upload.service';

@Module({
  exports: [ImageUploadService],
})
export class ImageUploadModule {}
