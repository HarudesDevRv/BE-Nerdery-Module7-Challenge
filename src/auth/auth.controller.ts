import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/requests/login.dto';
import { RegisterDto } from './dto/requests/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  register(@Body() dto: RegisterDto) {
    return this.authService.signup(dto);
  }

  @Post('signin')
  login(@Body() dto: LoginDto) {
    return this.authService.signin(dto);
  }

  @Post('signout')
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: { userId: string }) {
    return this.authService.signout(user.userId);
  }
}
