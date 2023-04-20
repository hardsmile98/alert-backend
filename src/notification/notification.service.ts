import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from 'src/prisma/prisma.service';
import { join } from 'path';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  async sendEmail(email: string, url: string) {
    return await this.mailerService
      .sendMail({
        to: email,
        subject: 'Notification AletSize',
        template: join(__dirname, '/../templates', 'alert'),
        context: {
          url,
        },
      })
      .catch((e) => {
        throw new HttpException(
          `Ошибка работы почты: ${JSON.stringify(e)}`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      });
  }

  async sendInUsAllUserChannels(user: User, url: string) {
    const channels = await this.prisma.chanel.findMany({
      where: { userId: user.id },
    });

    channels.forEach(({ type, value }) => {
      switch (type) {
        case 'email':
          return this.sendEmail(value, url);
        default:
          return;
      }
    });
  }
}
