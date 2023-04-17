import { ForbiddenException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddMonitorDto } from './dto';

@Injectable()
export class MonitorService {
  constructor(private prisma: PrismaService) {}

  async getMonitors(user: User) {
    return await this.prisma.monitor.findMany({
      where: {
        userId: user.id,
      },
    });
  }

  async deleteMonitor(user: User, id: number) {
    const matches = await this.prisma.monitor.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!matches) {
      throw new ForbiddenException('No delete access');
    }

    return await this.prisma.monitor.delete({
      where: {
        id,
      },
    });
  }

  async pauseMonitor(user: User, id: number) {
    const matches = await this.prisma.monitor.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!matches) {
      throw new ForbiddenException('No pause access');
    }

    return this.prisma.monitor.update({
      where: {
        id,
      },
      data: {
        status: 'PAUSE',
      },
    });
  }

  async addMonitor(user: User, dto: AddMonitorDto) {
    const { name, url, frequency } = dto;

    await this.prisma.monitor.create({
      data: {
        name,
        url,
        frequency,
        userId: user.id,
      },
    });

    // TODO loop check

    return {};
  }
}
