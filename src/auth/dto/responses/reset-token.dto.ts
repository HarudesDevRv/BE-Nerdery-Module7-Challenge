import { Exclude, Expose } from 'class-transformer';
import { IsJWT } from 'class-validator';

@Exclude()
export class ResetTokenDto {
  @Expose()
  @IsJWT()
  readonly reset_token!: string;

  @Expose()
  readonly expires_at!: Date;
}
