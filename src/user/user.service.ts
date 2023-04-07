import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChangePasswordDto } from './dto';
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
}
