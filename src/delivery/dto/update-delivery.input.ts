import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { DeliveryStatus } from '@prisma/client';
import { IsString, IsOptional } from 'class-validator';

registerEnumType(DeliveryStatus, { name: 'DeliveryStatus' });

@InputType()
export class UpdateDeliveryInput {
  @IsString()
  @IsOptional()
  @Field(() => DeliveryStatus)
  status?: DeliveryStatus;
  @IsOptional()
  estimatedDelivery?: Date;
}
