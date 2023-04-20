import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { AddMonitorDto } from './dto';

@Injectable()
export class MonitorService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
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

    const newStatus = matches.status === 'PAUSE' ? 'UP' : 'PAUSE';

    return this.prisma.monitor.update({
      where: {
        id,
      },
      data: {
        status: newStatus,
      },
    });
  }

  async addMonitor(user: User, dto: AddMonitorDto) {
    const isLimit = await this.checkLimit(user);

    if (isLimit) {
      throw new BadRequestException('Limit monitors for plan');
    }

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
