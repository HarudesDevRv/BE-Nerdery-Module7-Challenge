import { InputType } from '@nestjs/graphql';
import { DeliveryStatus } from '@prisma/client';
import { IsString, IsOptional } from 'class-validator';

@InputType()
export class UpdateDeliveryInput {
  @IsString()
  @IsOptional()
  status?: DeliveryStatus;
  @IsOptional()
  estimatedDelivery?: Date;
}
