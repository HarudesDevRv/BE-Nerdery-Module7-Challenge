import {
  Body,
  Controller,
  ForbiddenException,
  Param,
  Patch,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/requests/update-profile.dto';
import { UserProfileDto } from './dto/responses/user-profile.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiBearerAuth('access-token')
  @Patch(':id/profile')
  async updateProfile(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    if (id !== user.userId) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.updateProfile(id, dto);
  }
}
