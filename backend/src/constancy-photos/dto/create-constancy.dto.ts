import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConstancyDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}

