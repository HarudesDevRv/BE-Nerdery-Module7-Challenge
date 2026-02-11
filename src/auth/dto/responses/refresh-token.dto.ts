import { Exclude, Expose } from 'class-transformer';
import { IsJWT } from 'class-validator';

@Exclude()
export class RefreshTokenDto {
  @Expose()
  @IsJWT()
  readonly refresh_token!: string;

  @Expose()
  readonly expires_at!: Date;
}
