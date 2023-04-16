import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddChannelDto, ChangePasswordDto } from './dto';
import * as argon from 'argon2';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async changePassword(user: User, dto: ChangePasswordDto) {
    const { id, password } = user;
    const { currentPassword, newPassword } = dto;

    const pwMatches = await argon.verify(password, currentPassword);

    if (!pwMatches) {
      throw new BadRequestException('Incorrect current password');
    }

    const hash = await argon.hash(newPassword);

    const newUserData = await this.prisma.user.update({
      where: {
        id: id,
      },
      data: {
        password: hash,
      },
    });

    delete newUserData.password;

    return newUserData;
  }

  async addChannel(user: User, dto: AddChannelDto) {
    const { value, type } = dto;
    const { id } = user;

    const matches = await this.prisma.chanel.findFirst({
      where: {
        userId: id,
        value: value,
        type: type,
      },
    });

    if (matches) {
      throw new BadRequestException('This type of notification already exists');
    }

    return await this.prisma.chanel.create({
      data: {
        userId: id,
        value: value,
        type: type,
      },
    });
  }

  async getChannels(user: User) {
    const { id } = user;

    return await this.prisma.chanel.findMany({
      where: {
        userId: id,
      },
      select: {
        id: true,
        value: true,
        type: true,
      },
    });
  }

  async deleteChannel(user: User, id: number) {
    const { id: userId } = user;

    const matches = await this.prisma.chanel.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (matches) {
      throw new ForbiddenException('No delete access');
    }

    return await this.prisma.chanel.delete({
      where: {
        id: id,
      },
    });
  }
}
