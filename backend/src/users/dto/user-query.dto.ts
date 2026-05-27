import { UserStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class UserQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

