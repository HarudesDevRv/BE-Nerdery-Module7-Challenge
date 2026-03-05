import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  readonly new_password!: string;

  @ApiProperty({
    description: 'JSON Web Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    format: 'jwt',
  })
  @IsJWT()
  readonly reset_token!: string;
}
