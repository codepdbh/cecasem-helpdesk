import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class FirstAccessDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName!: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, {
    message: 'La contrasena debe incluir mayuscula, minuscula, numero y simbolo.',
  })
  password!: string;

  @IsString()
  confirmPassword!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

