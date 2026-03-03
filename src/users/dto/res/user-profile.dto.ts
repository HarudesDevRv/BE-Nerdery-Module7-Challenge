import { Exclude, Expose, Type } from 'class-transformer';
import { Role } from '@prisma/client';

@Exclude()
export class AddressDto {
  @Expose()
  readonly address: string;

  @Expose()
  readonly city: string;

  @Expose()
  readonly country: string;

  @Expose()
  readonly postalCode?: string;
}

@Exclude()
export class UserProfileDto {
  @Expose()
  readonly userId: string;

  @Expose()
  readonly email: string;

  @Expose()
  readonly firstName: string;

  @Expose()
  readonly lastName: string;

  @Expose()
  readonly role: Role;

  @Expose()
  @Type(() => AddressDto)
  readonly address: AddressDto;

  @Expose()
  readonly createdAt: Date;

  @Expose()
  readonly updatedAt: Date;
}
