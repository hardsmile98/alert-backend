import { Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { MonitorController } from './monitor.controller';

@Module({
  providers: [MonitorService],
  controllers: [MonitorController],
  imports: [],
})
export class MonitorModule {}
