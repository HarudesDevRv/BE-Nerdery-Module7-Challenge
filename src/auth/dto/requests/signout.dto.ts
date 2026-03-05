import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class SignoutDto {
  @ApiProperty({
    description: 'JSON Web Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    format: 'jwt',
  })
  @IsJWT()
  readonly refresh_token!: string;
}
