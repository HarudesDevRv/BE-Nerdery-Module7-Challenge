import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
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
  @MinLength(8)
  readonly password!: string;

  @IsOptional()
  readonly role: Role;
}
