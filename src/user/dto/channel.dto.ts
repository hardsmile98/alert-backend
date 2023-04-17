import { IsNotEmpty, IsIn } from 'class-validator';

type ChannelType = 'email' | 'telegram';

export class AddChannelDto {
  @IsNotEmpty()
  value: string;

  @IsIn(['email', 'telegram'])
  type: ChannelType;
}

export class IdDto {
  @IsNotEmpty()
  id: number;
}
