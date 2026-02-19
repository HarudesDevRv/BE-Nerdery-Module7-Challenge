import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';

@InputType()
export class UpdateDeliveryInput {
  @Field()
  @IsString()
  status: string;

  @Field({ nullable: true })
  @IsOptional()
  estimatedDelivery?: Date;
}
