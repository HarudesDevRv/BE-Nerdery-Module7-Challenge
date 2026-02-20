import { IsJWT } from 'class-validator';

export class SignoutDto {
  @IsJWT()
  readonly refresh_token!: string;
}
