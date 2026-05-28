import { IsString, MinLength } from 'class-validator';

export class RejectUserDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}

