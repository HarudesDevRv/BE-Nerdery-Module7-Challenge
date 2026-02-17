import { InputType } from '@nestjs/graphql';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateOrderInput {
  @IsArray()
  @IsOptional()
  codes?: string[];
  @IsString()
  @MaxLength(3)
  currency: string;
}
