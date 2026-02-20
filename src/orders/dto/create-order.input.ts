import { InputType } from '@nestjs/graphql';
import { IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateOrderInput {
  @IsString()
  @MaxLength(3)
  currency: string;
}
