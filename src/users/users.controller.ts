import { Body, Controller, Patch } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/req/update-profile.dto';
import { UserProfileDto } from './dto/res/user-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateProfile(user.userId, dto);
  }
}
