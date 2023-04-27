import { ChannelType } from '@prisma/client';
import { IsNotEmpty, IsIn } from 'class-validator';

export class AddChannelDto {
  @IsNotEmpty()
  value: string;

  @IsNotEmpty()
  @IsIn(['email', 'telegram'])
  type: ChannelType;
}

export class IdDto {
  @IsNotEmpty()
  id: number;
}
