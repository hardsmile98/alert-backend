import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { Method, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AddMonitorDto } from './dto';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name);
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async monitoring() {
    this.logger.log('Called cron monitoring');

    const allSites = await this.prisma.monitor.findMany({
      where: {
        NOT: {
          status: 'PAUSE',
        },
      },
    });

    for (const site of allSites) {
      const { id, url, checkAt, frequency, userId, method } = site;

      const minutesPassed = Math.floor(
        (new Date().getTime() - checkAt.getTime()) / (60 * 1000),
      );

      if (minutesPassed < frequency) {
        return;
      }

      const newStatus = await this.getStatusSite(url, method);

      this.logger.log(`Checked site: ${url}, status: ${newStatus}`);

      if (newStatus === 'DOWN') {
        await this.notification.sendInUsAllUserChannels(userId, url);
      }

      await this.prisma.monitor.update({
        where: { id: id },
        data: { status: newStatus, checkAt: new Date() },
      });
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async getMonitoringData() {
    this.logger.log('Called cron getMonitoringData');

    const allSites = await this.prisma.monitor.findMany({
      where: {
        NOT: {
          status: 'PAUSE',
        },
      },
      select: {
        id: true,
        url: true,
        method: true,
      },
    });

    for (const site of allSites) {
      const { id, url, method } = site;

      const start = Date.now();

      await this.getStatusSite(url, method);

      const end = Date.now();
      const responseTime = end - start;

      await this.prisma.monitorData.create({
        data: {
          monitorId: id,
          responseTime,
        },
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

    const data = await this.prisma.monitorData.findMany({
      where: {
        monitorId: monitorId,
      },
      select: {
        id: true,
        responseTime: true,
        createdAt: true,
      },
      take: 30,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      data,
      monitor,
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
      data.newStatus = await this.getStatusSite(matches.url, matches.method);
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

    const status = await this.getStatusSite(dto.url, dto.method);

    return await this.prisma.monitor.create({
      data: {
        ...dto,
        status: status,
        userId: user.id,
        checkAt: new Date(),
      },
    });
  }

  async getStatusSite(url: string, method: Method) {
    try {
      await axios({ method, url });
      return 'UP';
    } catch (error) {
      return 'DOWN';
    }
  }
}
