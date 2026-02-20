import {
  InputType,
  Field,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { OrderStatus } from '@prisma/client';
import {
  IsOptional,
  IsInt,
  IsEnum,
  IsNumber,
  IsDate,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType()
export class OrderFilterInput {
  @Field(() => Int, { defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
  @Field(() => Int, { defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fromDate?: Date;
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;
  @IsOptional()
  @IsEnum(OrderStatus)
  @Field(() => OrderStatus)
  status?: OrderStatus;
  @Field(() => Float)
  @IsOptional()
  @IsNumber()
  @Min(0)
  minTotal?: number;
  @Field(() => Float)
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTotal?: number;
}
