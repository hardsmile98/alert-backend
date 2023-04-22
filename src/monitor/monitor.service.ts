import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AddMonitorDto } from './dto';

@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name);
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async monitoring() {
    this.logger.log('Called cron');

    const allSites = await this.prisma.monitor.findMany({
      where: {
        NOT: {
          status: 'PAUSE',
        },
      },
      select: {
        id: true,
        url: true,
        frequency: true,
        status: true,
        checkAt: true,
      },
    });

    for (const site of allSites) {
      const { id, url, checkAt, frequency } = site;

      const minutesPassed = Math.floor(
        (new Date().getTime() - checkAt.getTime()) / (60 * 1000),
      );

      if (minutesPassed < frequency) {
        return;
      }

      const newStatus = await this.getStatusSite(url);

      this.logger.log(`Checked site: ${url}, status: ${newStatus}`);

      await this.prisma.monitor.update({
        where: { id: id },
        data: { status: newStatus, checkAt: new Date() },
      });
    }
  }

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

  async getMonitor(user: User, id: string) {
    const monitorId = Number(id);

    if (!Number.isInteger(monitorId)) {
      throw new BadRequestException('Incorrect params');
    }

    const monitor = await this.prisma.monitor.findFirst({
      where: {
        id: monitorId,
        userId: user.id,
      },
    });

    if (!monitor) {
      throw new BadRequestException('Monitoring not found');
    }

    return monitor;
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
      data.newStatus = await this.getStatusSite(matches.url);
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

    const status = await this.getStatusSite(url);

    return await this.prisma.monitor.create({
      data: {
        name,
        url,
        frequency,
        status: status,
        userId: user.id,
        checkAt: new Date(),
      },
    });
  }

  async getStatusSite(url: string) {
    try {
      await axios.get(url);
      return 'UP';
    } catch (error) {
      return 'DOWN';
    }
  }
}
