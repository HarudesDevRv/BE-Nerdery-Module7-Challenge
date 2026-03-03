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
import { UsersService } from '../users/users.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  private readonly saltRounds: number;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsProducer: NotificationsProducer,
    private usersService: UsersService,
  ) {
    this.saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'),
    );
  }

  async createAccessToken(email: string): Promise<RefreshTokenDto> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new ConflictException('The email is not registered');
    }

    const tokenId = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const rawToken = this.jwtService.sign(
      { sub: user.userId, email, role: user.role, jti: tokenId },
      { expiresIn: '60d' },
    );

    await this.prisma.refreshToken.create({
      data: {
        tokenId,
        userId: user.userId,
        tokenHash: await bcrypt.hash(rawToken, this.saltRounds),
        expiresAt,
      },
    });

    return { refresh_token: rawToken, expires_at: expiresAt };
  }

  async createResetToken(email: string): Promise<ResetTokenDto> {
    const user = await this.usersService.findByEmail(email);

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
    const exists = await this.usersService.findByEmail(dto.email);

    if (exists) {
      throw new ConflictException('Email already registered');
    }

    const newUser = await this.usersService.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: await bcrypt.hash(dto.password, this.saltRounds),
      role: dto.role,
    });

    const authToken = await this.createAccessToken(newUser.email);

    return plainToInstance(UserDto, { ...newUser, ...authToken });
  }

  async signin(dto: LoginDto): Promise<RefreshTokenDto> {
    const exists = await this.usersService.findByEmail(dto.email);

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
    const payload: unknown = this.jwtService.decode(token);

    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('jti' in payload)
    ) {
      throw new ConflictException("The token doesn't exist");
    }

    const { jti } = payload;
    if (typeof jti !== 'string' || !jti) {
      throw new ConflictException("The token doesn't exist");
    }

    const dbToken = await this.prisma.refreshToken.findUnique({
      where: { tokenId: jti },
    });

    if (!dbToken) {
      throw new ConflictException("The token doesn't exist");
    }

    const isValid = await bcrypt.compare(token, dbToken.tokenHash);
    if (!isValid) {
      throw new ConflictException("The token doesn't exist");
    }

    await this.prisma.refreshToken.update({
      where: { tokenId: jti },
      data: { revoked: true },
    });
  }

  async forgotPassword(email: string): Promise<ResetTokenDto> {
    const user = await this.usersService.findByEmail(email);

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
