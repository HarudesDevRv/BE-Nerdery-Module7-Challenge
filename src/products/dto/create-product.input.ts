import { InputType, Field, ID } from '@nestjs/graphql';
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

  @Field(() => ID)
  @IsUUID()
  categoryId: string;

  @Field(() => ID)
  @IsUUID()
  brandId: string;
}
