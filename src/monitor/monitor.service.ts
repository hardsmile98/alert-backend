import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonitoringService } from 'src/monitoring/monitoring.service';
import { AddMonitorDto } from './dto';

@Injectable()
export class MonitorService {
  constructor(
    private prisma: PrismaService,
    private monitoring: MonitoringService,
  ) {}

  async checkLimit(user: User) {
    const countMonitors = await this.prisma.monitor.count({
      where: {
        userId: user.id,
      },
    });

    if (user.plan === 'free') {
      if (countMonitors === 1) {
        return true;
      }
    }

    return false;
  }

  async getMonitors(user: User) {
    const monitors = await this.prisma.monitor.findMany({
      where: {
        userId: user.id,
      },
    });

    const isLimit = await this.checkLimit(user);

    return {
      monitors,
      isLimit,
    };
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

  async changeStatusMonitor(user: User, id: number) {
    const matches = await this.prisma.monitor.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!matches) {
      throw new ForbiddenException('No change status access');
    }

    const data = { newStatus: matches.status };

    if (matches.status === 'PAUSE') {
      data.newStatus = await this.monitoring.getStatusSite(matches.url);
    } else {
      data.newStatus = 'PAUSE';
    }

    return this.prisma.monitor.update({
      where: {
        id,
      },
      data: {
        status: data.newStatus,
      },
    });
  }

  async addMonitor(user: User, dto: AddMonitorDto) {
    const isLimit = await this.checkLimit(user);

    if (isLimit) {
      throw new BadRequestException('Limit monitors for plan');
    }

    const { name, url, frequency } = dto;

    const status = await this.monitoring.getStatusSite(url);

    return await this.prisma.monitor.create({
      data: {
        name,
        url,
        frequency,
        status: status,
        userId: user.id,
        ckeckAt: new Date(),
      },
    });
  }
}
