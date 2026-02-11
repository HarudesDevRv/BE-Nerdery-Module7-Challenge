import { Exclude, Expose } from 'class-transformer';
import { Role } from '@prisma/client';

@Exclude()
export class UserDto {
  @Expose()
  readonly firstName!: string;

  @Expose()
  readonly lastName!: string;

  @Expose()
  readonly email!: string;

  @Expose()
  readonly role!: Role;

  @Expose()
  readonly refresh_token!: string;

  @Expose()
  readonly expires_at!: Date;
}
