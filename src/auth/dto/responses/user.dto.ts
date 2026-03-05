import { Exclude, Expose } from 'class-transformer';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class UserDto {
  @Expose()
  readonly firstName!: string;

  @Expose()
  readonly lastName!: string;

  @Expose()
  readonly email!: string;

  @ApiProperty({
    enum: Role,
    enumName: 'UserRole',
  })
  @Expose()
  readonly role!: Role;

  @ApiProperty({
    description: 'JSON Web Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    format: 'jwt',
  })
  @Expose()
  readonly refresh_token!: string;

  @Expose()
  readonly expires_at!: Date;
}
