import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  readonly postalCode?: string;
}
