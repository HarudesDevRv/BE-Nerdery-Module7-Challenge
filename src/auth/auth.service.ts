import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/requests/register.dto';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { UserDto } from './dto/responses/user.dto';
import { RefreshTokenDto } from './dto/responses/refresh-token.dto';
import { LoginDto } from './dto/requests/login.dto';
import { ResetTokenDto } from './dto/responses/reset-token.dto';
import { ResetPasswordDto } from './dto/requests/reset-password.dto';
import { NotificationsProducer } from '../notifications/notifications.producer';

@Injectable()
export class AuthService {
  private readonly saltRounds: number;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsProducer: NotificationsProducer,
  ) {
    this.saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'),
    );
  }

  async createAccessToken(email: string): Promise<RefreshTokenDto> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new ConflictException('The email is not registered');
    }

    const authToken = await this.prisma.refreshToken.create({
      data: {
        userId: user.userId,
        refreshToken: this.jwtService.sign(
          {
            sub: user.userId,
            email,
            role: user.role,
          },
          { expiresIn: '60d' },
        ),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      refresh_token: authToken.refreshToken,
      expires_at: authToken.expiresAt,
    };
  }

  async createResetToken(email: string): Promise<ResetTokenDto> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new ConflictException('The email is not registered');
    }

    const authToken = await this.prisma.passwordReset.create({
      data: {
        userId: user?.userId,
        resetToken: this.jwtService.sign(
          { email, role: user.role },
          {
            expiresIn: '5m',
          },
        ),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return {
      reset_token: authToken.resetToken,
      expires_at: authToken.expiresAt,
    };
  }

  async signup(dto: RegisterDto): Promise<UserDto> {
    // TODO: implement registration
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('Email already registered');
    }

    const newUser = await this.prisma.user.create({
      include: { address: {} },
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: await bcrypt.hash(dto.password, this.saltRounds),
        role: dto.role,
        address: { create: {} },
      },
    });

    const authToken = await this.createAccessToken(newUser.email);

    return plainToInstance(UserDto, { ...newUser, ...authToken });
  }

  async signin(dto: LoginDto): Promise<RefreshTokenDto> {
    // TODO: implement login
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!exists) {
      throw new ConflictException('Email not registered');
    }

    const matches = await bcrypt.compare(dto.password, exists.password);

    if (!matches) {
      throw new ConflictException("The email and password don't match");
    }

    return this.createAccessToken(exists.email);
  }

  async signout(token: string): Promise<void> {
    // TODO: implement logout (revoke refresh token)
    try {
      await this.prisma.refreshToken.update({
        where: {
          refreshToken: token,
        },
        data: {
          revoked: true,
        },
      });
    } catch (error) {
      throw new ConflictException("The token doesn't exist");
    }
  }

  async forgotPassword(email: string): Promise<ResetTokenDto> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ConflictException('The email is not registered');
    }

    const resetPassword = await this.createResetToken(user.email);

    await this.notificationsProducer.notifyPasswordReset({
      email: user.email,
      resetToken: resetPassword.reset_token,
      expiresAt: resetPassword.expires_at,
    });

    return resetPassword;
  }

  async resetPassword(body: ResetPasswordDto): Promise<RefreshTokenDto> {
    const token = await this.prisma.passwordReset.findUnique({
      where: {
        resetToken: body.reset_token,
      },
    });

    if (!token) {
      throw new ConflictException('Invalid reset token');
    }

    if (token.expiresAt.getTime() < Date.now()) {
      throw new ConflictException('Token already expired, please start again');
    }

    const newToken = await this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.update({
        where: {
          userId: token.userId,
        },
        data: {
          password: await bcrypt.hash(body.new_password, 10),
        },
      });

      await prisma.passwordReset.update({
        where: {
          resetToken: body.reset_token,
        },
        data: {
          consumed: true,
        },
      });

      await prisma.refreshToken.updateMany({
        where: {
          userId: user.userId,
        },
        data: {
          revoked: true,
        },
      });

      return this.createAccessToken(user.email);
    });

    return newToken;
  }
}
