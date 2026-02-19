import { InputType, Field, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

@InputType()
export class UpdatePromoCodeInput {
  @IsOptional()
  expirationDate?: Date;
  @Field(() => Int)
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;
  @Field(() => Int)
  @IsOptional()
  @IsInt()
  @Min(0)
  minAmount?: number;
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
