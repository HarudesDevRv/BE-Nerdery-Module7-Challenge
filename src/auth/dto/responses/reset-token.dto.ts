import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsJWT } from 'class-validator';

@Exclude()
export class ResetTokenDto {
  @ApiProperty({
    description: 'JSON Web Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    format: 'jwt',
  })
  @Expose()
  @IsJWT()
  readonly reset_token!: string;

  @Expose()
  readonly expires_at!: Date;
}
