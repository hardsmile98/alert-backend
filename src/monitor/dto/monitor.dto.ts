import { IsNotEmpty, IsUrl, Max, Min } from 'class-validator';

export class AddMonitorDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsUrl()
  url: string;

  @IsNotEmpty()
  @Min(10)
  @Max(60)
  frequency: number;
}

export class IdDto {
  @IsNotEmpty()
  id: number;
}
