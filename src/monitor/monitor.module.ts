import { Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { MonitorController } from './monitor.controller';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  providers: [MonitorService],
  controllers: [MonitorController],
  imports: [NotificationModule],
})
export class MonitorModule {}
