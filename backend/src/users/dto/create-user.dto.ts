import { UserRole, UserStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
  password!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role: UserRole = UserRole.USER;

  @IsOptional()
  @IsEnum(UserStatus)
  status: UserStatus = UserStatus.ACTIVE;
}

