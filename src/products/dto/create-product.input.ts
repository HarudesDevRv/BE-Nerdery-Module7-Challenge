import { InputType, Field } from '@nestjs/graphql';
import { IsString, MaxLength, IsUUID } from 'class-validator';

@InputType()
export class CreateProductInput {
  @Field()
  @IsString()
  @MaxLength(100)
  name: string;

  @Field()
  @IsString()
  @MaxLength(1000)
  description: string;

  @Field()
  @IsUUID()
  categoryId: string;

  @Field()
  @IsUUID()
  brandId: string;
}
