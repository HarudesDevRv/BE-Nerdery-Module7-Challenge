import { Injectable } from '@nestjs/common';
import { ReadStream } from 'graphql-upload-ts';

@Injectable()
export class ImageUploadService {
  async UploadImage(stream: ReadStream, mimetype: string): Promise<string> {
    //TODO: Implement image upload
    return 'URL';
  }
}
