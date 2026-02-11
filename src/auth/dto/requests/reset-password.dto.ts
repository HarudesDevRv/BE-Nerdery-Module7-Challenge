import { IsJWT, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  readonly new_password!: string;

  @IsJWT()
  readonly reset_token!: string;
}
