import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { MonitorService } from './monitor.service';
import { GetUser } from 'src/auth/decorator';
import { AddMonitorDto } from './dto';
import { User } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('monitor')
export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  @Get('/')
  getMonitors(@GetUser() user: User) {
    return this.monitorService.getMonitors(user);
  }

  @Delete('/')
  deleteMonitor(@GetUser() user: User, @Body() dto) {
    const { id } = dto;
    return this.monitorService.deleteMonitor(user, id);
  }

  @Delete('/pause')
  pauseMonitor(@GetUser() user: User, @Body() dto) {
    const { id } = dto;
    return this.monitorService.pauseMonitor(user, id);
  }

  @Post('/')
  addMonitor(@GetUser() user: User, @Body() dto: AddMonitorDto) {
    return this.monitorService.addMonitor(user, dto);
  }
}
