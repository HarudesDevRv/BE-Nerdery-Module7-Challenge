import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class CreateGuestOrderInput {
  @Field(() => ID)
  @IsUUID()
  inventoryId: string;

  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(3)
  currency: string;
}
