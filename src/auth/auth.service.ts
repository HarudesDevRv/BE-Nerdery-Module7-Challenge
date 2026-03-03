import { ConflictException, Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(AuthService.name);

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
    this.logger.log(`Creating access token for user: ${email}`);
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
    this.logger.log(`Creating password reset token for: ${email}`);
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
    this.logger.log(`Signup attempt for: ${dto.email}`);
    const exists = await this.usersService.findByEmail(dto.email);

    if (exists) {
      this.logger.warn(`Signup failed — email already registered: ${dto.email}`);
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
    this.logger.log(`User registered successfully: ${newUser.email}`);

    return plainToInstance(UserDto, { ...newUser, ...authToken });
  }

  async signin(dto: LoginDto): Promise<RefreshTokenDto> {
    this.logger.log(`Signin attempt for: ${dto.email}`);
    const exists = await this.usersService.findByEmail(dto.email);

    if (!exists) {
      this.logger.warn(`Signin failed — email not registered: ${dto.email}`);
      throw new ConflictException('Email not registered');
    }

    const matches = await bcrypt.compare(dto.password, exists.password);

    if (!matches) {
      this.logger.warn(`Signin failed — invalid password for: ${dto.email}`);
      throw new ConflictException("The email and password don't match");
    }

    this.logger.log(`User signed in successfully: ${dto.email}`);
    return this.createAccessToken(exists.email);
  }

  async signout(token: string): Promise<void> {
    this.logger.log('Signout attempt');
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
    this.logger.log(`Token revoked: ${jti}`);
  }

  async forgotPassword(email: string): Promise<ResetTokenDto> {
    this.logger.log(`Forgot password request for: ${email}`);
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
    this.logger.log(`Password reset notification queued for: ${email}`);

    return resetPassword;
  }

  async resetPassword(body: ResetPasswordDto): Promise<RefreshTokenDto> {
    this.logger.log('Password reset attempt');
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

      const newAccessToken = this.createAccessToken(user.email);
      this.logger.log(`Password reset successfully for userId: ${token.userId}`);
      return newAccessToken;
    });

    return newToken;
  }
}
