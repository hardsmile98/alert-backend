import { Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { MonitorController } from './monitor.controller';
import { MonitoringModule } from 'src/monitoring/monitoring.module';

@Module({
  providers: [MonitorService],
  controllers: [MonitorController],
  imports: [MonitoringModule],
})
export class MonitorModule {}
