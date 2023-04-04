import { BadRequestException, Injectable } from '@nestjs/common';
import * as argon from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) throw new BadRequestException('Credentials incorrect');

    const pwMatches = await argon.verify(user.password, dto.password);

    if (!pwMatches) throw new BadRequestException('Password incorrect');

    return this.getToken(user.id);
  }

  async register(dto: RegisterDto) {
    const isExist = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (isExist) {
      throw new BadRequestException('Email taken');
    }

    const hash = await argon.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    return this.getToken(user.id);
  }

  async getToken(userId: number): Promise<{ token: string }> {
    const payload = {
      userId,
    };

    const secret = this.config.get('SECRET');

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: secret,
    });

    return {
      token,
    };
  }
}
