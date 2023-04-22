import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { MonitorService } from './monitor.service';
import { GetUser } from 'src/auth/decorator';
import { AddMonitorDto, IdDto } from './dto';
import { User } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('monitor')
export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  @Get('/:id')
  getMonitor(@GetUser() user: User, @Param('id') id: string) {
    return this.monitorService.getMonitor(user, id);
  }

  @Get('/')
  getMonitors(@GetUser() user: User) {
    return this.monitorService.getMonitors(user);
  }

  @Delete('/')
  deleteMonitor(@GetUser() user: User, @Body() dto: IdDto) {
    const { id } = dto;
    return this.monitorService.deleteMonitor(user, id);
  }

  @Post('/status')
  changeStatusMonitor(@GetUser() user: User, @Body() dto: IdDto) {
    const { id } = dto;
    return this.monitorService.changeStatusMonitor(user, id);
  }

  @Post('/')
  addMonitor(@GetUser() user: User, @Body() dto: AddMonitorDto) {
    return this.monitorService.addMonitor(user, dto);
  }
}
