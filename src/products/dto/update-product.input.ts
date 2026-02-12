import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateProductInput } from './create-product.input';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class UpdateProductInput extends PartialType(CreateProductInput) {
  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
