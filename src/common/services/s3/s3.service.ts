import { Injectable } from '@nestjs/common';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ConfigService } from '@nestjs/config';
import * as graphqlUploadTs from 'graphql-upload-ts';
import path from 'path';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  constructor(configService: ConfigService) {
    const region = configService.getOrThrow<string>('AWS_REGION', 'us-east-1');
    this.client = new S3Client({
      region,
    });
    this.bucket = configService.getOrThrow<string>('AWS_S3_BUCKET_NAME');
  }

  async UploadImage(
    file: graphqlUploadTs.FileUpload,
    uploadKey: string,
  ): Promise<string | undefined> {
    const stream = file.createReadStream();

    const extension = path.extname(file.filename);

    const uploadParams = {
      Bucket: this.bucket,
      Key: uploadKey + extension,
      Body: stream,
      encode: file.encoding,
    };

    const upload = new Upload({
      client: this.client,
      params: uploadParams,
    });

    const uploadedFile = await upload.done();

    return uploadedFile.Location;
  }

  async DeleteImage(fileKey: string): Promise<boolean> {
    const deleteParams = {
      Bucket: this.bucket,
      Key: fileKey,
    };

    const deleteCommand = new DeleteObjectCommand(deleteParams);

    try {
      const deletedImage = await this.client.send(deleteCommand);
      return deletedImage.DeleteMarker ?? false;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error('Could not delete file');
      } else {
        throw new Error('Unknown error');
      }
    }
  }
}
