import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { DeliveryStatus } from '@prisma/client';
import { IsString, IsOptional, IsEnum, IsDate } from 'class-validator';

registerEnumType(DeliveryStatus, { name: 'DeliveryStatus' });

@InputType()
export class UpdateDeliveryInput {
  @IsString()
  @IsOptional()
  @IsEnum(DeliveryStatus)
  @Field(() => DeliveryStatus)
  readonly status?: DeliveryStatus;

  @IsOptional()
  @IsDate()
  readonly estimatedDelivery?: Date;
}
