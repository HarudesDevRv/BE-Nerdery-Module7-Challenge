import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Length,
  IsEnum,
} from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsEmail()
  readonly email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly lastName!: string;

  @IsString()
  @Length(8, 16)
  readonly password!: string;

  @ApiProperty({
    enum: Role,
    enumName: 'UserRole',
  })
  @IsOptional()
  @IsEnum(Role)
  readonly role: Role;
}
