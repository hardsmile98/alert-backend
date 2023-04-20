import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { NotificationService } from './notification.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getMailConfig } from 'src/configs/mail.configs';

@Module({
  providers: [NotificationService],
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getMailConfig,
    }),
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
