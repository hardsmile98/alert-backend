import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guard';
import { AddChannelDto, ChangePasswordDto, IdDto } from './dto';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  getMe() {
    return {};
  }

  @Get('profile')
  getProfle(@GetUser() user: User) {
    delete user.password;
    return user;
  }

  @Post('channels')
  addChannel(@GetUser() user: User, @Body() dto: AddChannelDto) {
    return this.userService.addChannel(user, dto);
  }

  @Get('channels')
  getChannels(@GetUser() user: User) {
    return this.userService.getChannels(user);
  }

  @Delete('channels')
  deleteChannel(@GetUser() user: User, @Body() dto: IdDto) {
    const { id } = dto;
    return this.userService.deleteChannel(user, id);
  }

  @Post('changePassword')
  changePassword(@GetUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(user, dto);
  }
}
