import { IsNotEmpty, IsUrl, Max, Min } from 'class-validator';

export class AddMonitorDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsUrl()
  url: string;

  @IsNotEmpty()
  @Min(5)
  @Max(60)
  frequency: number;
}
