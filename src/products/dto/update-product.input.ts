import { InputType, PartialType } from '@nestjs/graphql';
import { CreateProductInput } from './create-product.input';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class UpdateProductInput extends PartialType(CreateProductInput) {
  @IsBoolean()
  @IsOptional()
  readonly isActive?: boolean;
}
