import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  constructor(private prisma: PrismaService) {}

  async getStatusSite(url: string) {
    try {
      await axios.get(url);
      return 'UP';
    } catch (error) {
      return 'DOWN';
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async monitoring() {
    this.logger.debug('Called cron');

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
        ckeckAt: true,
      },
    });

    for (const site of allSites) {
      const { id, url, ckeckAt, frequency } = site;

      const minutesPassed = Math.floor(
        (new Date().getTime() - ckeckAt.getTime()) / (60 * 1000),
      );

      if (minutesPassed < frequency) {
        return;
      }

      const newStatus = await this.getStatusSite(url);

      await this.prisma.monitor.update({
        where: { id: id },
        data: { status: newStatus, ckeckAt: new Date() },
      });
    }
  }
}
