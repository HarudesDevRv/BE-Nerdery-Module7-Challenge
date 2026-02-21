import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsISO4217CurrencyCode,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

@InputType()
export class CreateOrderInput {
  @IsString()
  @IsISO4217CurrencyCode()
  readonly currency!: string;

  @Field(() => ID)
  @IsUUID(4)
  @IsOptional()
  readonly addressId?: string;
}
