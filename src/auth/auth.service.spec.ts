/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { createMockPrismaService } from 'src/common/mocks/prisma.mock';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsProducer } from '../notifications/notifications.producer';
import { ConflictException } from '@nestjs/common';
import { PasswordReset, RefreshToken, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fixtures from './auth.service.fixtures';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedPassword'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockNotificationsProducer: ReturnType<
    typeof fixtures.createMockNotificationsProducer
  >;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockNotificationsProducer = fixtures.createMockNotificationsProducer();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: fixtures.createMockJwtService() },
        {
          provide: ConfigService,
          useValue: fixtures.createMockConfigService(),
        },
        { provide: NotificationsProducer, useValue: mockNotificationsProducer },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccessToken', () => {
    it('should return a refresh token for a registered email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fixtures.fakeUser as User);
      mockPrisma.refreshToken.create.mockResolvedValue(
        fixtures.fakeRefreshToken as RefreshToken,
      );

      const result = await service.createAccessToken('test@example.com');

      expect(result).toEqual({
        refresh_token: 'fake-jwt-token',
        expires_at: fixtures.fakeRefreshToken.expiresAt,
      });
    });

    it('should throw ConflictException when email is not registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createAccessToken('unknown@example.com'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createResetToken', () => {
    it('should return a reset token for a registered email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fixtures.fakeUser as User);
      mockPrisma.passwordReset.create.mockResolvedValue(
        fixtures.fakePasswordReset as PasswordReset,
      );

      const result = await service.createResetToken('test@example.com');

      expect(result).toEqual({
        reset_token: 'fake-reset-token',
        expires_at: fixtures.fakePasswordReset.expiresAt,
      });
    });

    it('should throw ConflictException when email is not registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createResetToken('unknown@example.com'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('signup', () => {
    it('should register a new user and return user data with a token', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // no existing user
        .mockResolvedValueOnce(fixtures.fakeUser as User); // inside createAccessToken
      mockPrisma.user.create.mockResolvedValue({
        ...fixtures.fakeUser,
        address: {},
      } as unknown as User);
      mockPrisma.refreshToken.create.mockResolvedValue(
        fixtures.fakeRefreshToken as RefreshToken,
      );

      const result = await service.signup({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        role: Role.client,
      });

      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('John');
      expect(result.refresh_token).toBe('fake-jwt-token');
    });

    it('should throw ConflictException when email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fixtures.fakeUser as User);

      await expect(
        service.signup({
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'password123',
          role: Role.client,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('signin', () => {
    it('should sign in and return a refresh token', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(fixtures.fakeUser as User) // signin check
        .mockResolvedValueOnce(fixtures.fakeUser as User); // inside createAccessToken
      mockPrisma.refreshToken.create.mockResolvedValue(
        fixtures.fakeRefreshToken as RefreshToken,
      );

      const result = await service.signin({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        refresh_token: 'fake-jwt-token',
        expires_at: fixtures.fakeRefreshToken.expiresAt,
      });
    });

    it('should throw ConflictException when email is not registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.signin({ email: 'unknown@example.com', password: 'pass' }),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw ConflictException when passwords don't match", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockPrisma.user.findUnique.mockResolvedValue(fixtures.fakeUser as User);

      await expect(
        service.signin({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('signout', () => {
    it('should revoke the refresh token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({} as RefreshToken);
      mockPrisma.refreshToken.update.mockResolvedValue({} as RefreshToken);

      await expect(service.signout('fake-jwt-token')).resolves.not.toThrow();
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { refreshToken: 'fake-jwt-token' },
        data: { revoked: true },
      });
    });

    it("should throw ConflictException when token doesn't exist", async () => {
      mockPrisma.refreshToken.update.mockRejectedValue(new Error('Not found'));

      await expect(service.signout('invalid-token')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should create a reset token and queue a notification', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(fixtures.fakeUser as User)
        .mockResolvedValueOnce(fixtures.fakeUser as User);
      mockPrisma.passwordReset.create.mockResolvedValue(
        fixtures.fakePasswordReset as PasswordReset,
      );

      const result = await service.forgotPassword('test@example.com');

      expect(result).toEqual({
        reset_token: 'fake-reset-token',
        expires_at: fixtures.fakePasswordReset.expiresAt,
      });
      expect(
        mockNotificationsProducer.notifyPasswordReset,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' }),
      );
    });

    it('should throw ConflictException when email is not registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.forgotPassword('unknown@example.com'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('resetPassword', () => {
    it('should reset the password and return a new refresh token', async () => {
      mockPrisma.passwordReset.findUnique.mockResolvedValue(
        fixtures.fakePasswordReset as PasswordReset,
      );
      mockPrisma.$transaction.mockImplementation(async (fn: any) =>
        fn(mockPrisma),
      );
      mockPrisma.user.update.mockResolvedValue(fixtures.fakeUser as User);
      mockPrisma.passwordReset.update.mockResolvedValue(
        fixtures.fakePasswordReset as PasswordReset,
      );
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.user.findUnique.mockResolvedValue(fixtures.fakeUser as User);
      mockPrisma.refreshToken.create.mockResolvedValue(
        fixtures.fakeRefreshToken as RefreshToken,
      );

      const result = await service.resetPassword({
        reset_token: 'fake-reset-token',
        new_password: 'newpassword123',
      });

      expect(result).toEqual({
        refresh_token: 'fake-jwt-token',
        expires_at: fixtures.fakeRefreshToken.expiresAt,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: fixtures.fakeUser.userId },
          data: expect.objectContaining({
            password: fixtures.mockHashedPassword,
          }),
        }),
      );

      expect(mockPrisma.passwordReset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { resetToken: 'fake-reset-token' },
          data: { consumed: true },
        }),
      );

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: fixtures.fakeUser.userId },
          data: { revoked: true },
        }),
      );
    });

    it('should throw ConflictException for an invalid reset token', async () => {
      mockPrisma.passwordReset.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          reset_token: 'invalid',
          new_password: 'newpass',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for an expired reset token', async () => {
      mockPrisma.passwordReset.findUnique.mockResolvedValue(
        fixtures.fakePasswordResetExpired as PasswordReset,
      );

      await expect(
        service.resetPassword({
          reset_token: 'expired-token',
          new_password: 'newpass',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
