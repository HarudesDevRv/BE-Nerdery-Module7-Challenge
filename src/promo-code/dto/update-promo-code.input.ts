import { InputType, Field, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

@InputType()
export class UpdatePromoCodeInput {
  @IsOptional()
  readonly expirationDate?: Date;

  @Field(() => Int)
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly usageLimit?: number;

  @Field(() => Int)
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly minAmount?: number;

  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}
