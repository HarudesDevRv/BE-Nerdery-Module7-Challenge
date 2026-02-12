import { InputType, Field } from '@nestjs/graphql';
import { UploadScalar } from '../models/upload.scalar';
import * as graphqlUploadTs from 'graphql-upload-ts';

@InputType()
export class UploadImageInput {
  @Field(() => UploadScalar)
  file: graphqlUploadTs.FileUpload;
}
