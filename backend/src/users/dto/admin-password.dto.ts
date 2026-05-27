import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class AdminPasswordDto {
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
  newPassword!: string;

  @IsOptional()
  @IsBoolean()
  mustChangePassword = true;
}

