import { IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, {
    message: 'La nueva contrasena debe incluir mayuscula, minuscula, numero y simbolo.',
  })
  newPassword!: string;

  @IsString()
  confirmPassword!: string;
}

