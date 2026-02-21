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

  @IsOptional()
  @IsEnum(Role)
  readonly role: Role;
}
