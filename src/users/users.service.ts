import { Injectable, Logger } from '@nestjs/common';
import { Role } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { UpdateProfileDto } from './dto/requests/update-profile.dto';
import { UserProfileDto } from './dto/responses/user-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    this.logger.log(`Finding user by email: ${email}`);
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(userId: string) {
    this.logger.log(`Finding user by ID: ${userId}`);
    return this.prisma.user.findUnique({
      where: { userId },
      include: { address: true },
    });
  }

  async create(data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: Role;
  }) {
    this.logger.log(`Creating user: ${data.email} (role: ${data.role})`);
    return this.prisma.user.create({
      include: { address: {} },
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        role: data.role,
        address: { create: {} },
        cart: data.role === 'client' ? { create: {} } : undefined,
      },
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    this.logger.log(`Updating password for userId: ${userId}`);
    return this.prisma.user.update({
      where: { userId },
      data: { password: hashedPassword },
    });
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    this.logger.log(`Updating profile for userId: ${userId}`);
    const user = await this.prisma.user.update({
      where: { userId },
      include: { address: true },
      data: {
        firstName: dto.firstName ?? undefined,
        lastName: dto.lastName ?? undefined,
        address: {
          update: {
            address: dto.address ?? undefined,
            city: dto.city ?? undefined,
            country: dto.country ?? undefined,
            postalCode: dto.postalCode ?? undefined,
          },
        },
      },
    });

    return plainToInstance(UserProfileDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
