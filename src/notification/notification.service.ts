import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from 'src/prisma/prisma.service';
import { join } from 'path';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  async sendEmail(email: string, url: string) {
    return await this.mailerService
      .sendMail({
        to: email,
        subject: 'Notification AlertSize',
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

  async sendInUsAllUserChannels(userId: number, url: string) {
    const channels = await this.prisma.chanel.findMany({
      where: { userId: userId },
    });

    for (const channel of channels) {
      const { type, value } = channel;

      try {
        switch (type) {
          case 'email':
            return this.sendEmail(value, url);
          default:
            return;
        }
      } catch (e) {
        this.logger.error(`Error send in channel: ${value}, error: ${e}`);
      }
    }
  }
}
