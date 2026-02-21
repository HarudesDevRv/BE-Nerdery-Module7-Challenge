import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, MaxLength, IsUUID } from 'class-validator';

@InputType()
export class CreateProductInput {
  @IsString()
  @MaxLength(100)
  readonly name!: string;

  @IsString()
  @MaxLength(1000)
  readonly description!: string;

  @Field(() => ID)
  @IsUUID(4)
  readonly categoryId!: string;

  @Field(() => ID)
  @IsUUID(4)
  readonly brandId!: string;
}
