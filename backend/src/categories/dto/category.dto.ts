import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCategoryDto extends CreateCategoryDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

