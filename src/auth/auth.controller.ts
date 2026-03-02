import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/requests/login.dto';
import { RegisterDto } from './dto/requests/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ForgotPasswordDto } from './dto/requests/forgot-password.dto';
import { ResetPasswordDto } from './dto/requests/reset-password.dto';
import { SignoutDto } from './dto/requests/signout.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { RefreshTokenDto } from './dto/responses/refresh-token.dto';
import { ResetTokenDto } from './dto/responses/reset-token.dto';
import { UserDto } from './dto/responses/user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async register(@Body() dto: RegisterDto): Promise<UserDto> {
    return this.authService.signup(dto);
  }

  @Post('signin')
  async login(@Body() dto: LoginDto): Promise<RefreshTokenDto> {
    return this.authService.signin(dto);
  }

  @Post('signout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body() dto: SignoutDto): Promise<void> {
    return this.authService.signout(dto.refresh_token);
  }

  @Post('forgot-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ResetTokenDto> {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<RefreshTokenDto> {
    return this.authService.resetPassword(dto);
  }
}
