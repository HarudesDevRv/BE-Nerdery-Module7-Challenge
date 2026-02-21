import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsUUID,
  Min,
} from 'class-validator';

@InputType()
export class CreateInventoryInput {
  @Field(() => ID)
  @IsUUID(4)
  readonly productId!: string;

  @Field(() => ID)
  @IsUUID(4)
  readonly storeId!: string;

  @Field(() => Float)
  @IsPositive()
  readonly price!: number;

  @Field(() => Float)
  @IsPositive()
  readonly salePrice!: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  readonly stock!: number;

  @Field({ defaultValue: true })
  @IsOptional()
  @IsBoolean()
  readonly isActive: boolean = true;
}
