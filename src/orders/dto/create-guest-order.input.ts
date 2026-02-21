import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsISO4217CurrencyCode,
  IsString,
  IsUUID,
} from 'class-validator';

@InputType()
export class CreateGuestOrderInput {
  @Field(() => ID)
  @IsUUID(4)
  readonly inventoryId!: string;

  @IsEmail()
  readonly email!: string;

  @IsString()
  @IsISO4217CurrencyCode()
  readonly currency!: string;

  @Field(() => ID)
  @IsUUID()
  readonly addressId!: string;
}
