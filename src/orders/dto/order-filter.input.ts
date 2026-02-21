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

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType()
export class OrderFilterInput {
  @Field(() => Int, { defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly offset?: number;

  @Field(() => Int, { defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly limit?: number;

  @IsOptional()
  @IsDate()
  readonly fromDate?: Date;

  @IsOptional()
  @IsDate()
  readonly toDate?: Date;

  @IsOptional()
  @IsEnum(OrderStatus)
  @Field(() => OrderStatus)
  readonly status?: OrderStatus;

  @Field(() => Float)
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly minTotal?: number;

  @Field(() => Float)
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly maxTotal?: number;
}
