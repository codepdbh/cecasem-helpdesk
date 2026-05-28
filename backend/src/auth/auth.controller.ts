import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { FirstAccessDto } from './dto/first-access.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { uploadOptions } from '../common/utils/file-upload.utils';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@ApiTags('Autenticacion')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('network-info')
  networkInfo(@Req() request: Request) {
    return this.auth.networkInfo(request);
  }

  @Post('first-access')
  @Throttle({ default: { limit: 4, ttl: 60000 } })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', uploadOptions('profiles', 3)))
  firstAccess(
    @Body() dto: FirstAccessDto,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @Req() request: Request,
  ) {
    return this.auth.firstAccess(dto, photo, request);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.auth.login(dto, request);
  }

  @Post('password-reset-request')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  passwordResetRequest(@Body() dto: PasswordResetRequestDto, @Req() request: Request) {
    return this.auth.passwordResetRequest(dto, request);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: AuthUser, @Req() request: Request) {
    return this.auth.logout(user, request);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@CurrentUser() user: AuthUser) {
    return this.auth.profile(user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto, @Req() request: Request) {
    return this.auth.updateProfile(user, dto, request);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', uploadOptions('profiles', 3)))
  @Patch('profile/photo')
  updatePhoto(
    @CurrentUser() user: AuthUser,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @Req() request: Request,
  ) {
    return this.auth.updatePhoto(user, photo, request);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Req() request: Request,
  ) {
    return this.auth.changePassword(user, dto, request);
  }
}
