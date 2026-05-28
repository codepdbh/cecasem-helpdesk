import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PasswordChangedGuard } from '../common/guards/password-changed.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('Categorias')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(JwtAuthGuard, PasswordChangedGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  findAll() {
    return this.categories.findAll();
  }

  @Post()
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(RolesGuard)
  activate(@Param('id') id: string) {
    return this.categories.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(RolesGuard)
  deactivate(@Param('id') id: string) {
    return this.categories.deactivate(id);
  }
}

