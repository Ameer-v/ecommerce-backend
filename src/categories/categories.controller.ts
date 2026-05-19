import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryDto } from './dto/category.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lihat semua kategori' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lihat kategori by ID' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buat kategori baru (Admin only)' })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('Admin')
  create(@Body() dto: CategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update kategori (Admin only)' })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('Admin')
  update(@Param('id') id: string, @Body() dto: CategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Hapus kategori (Admin only)' })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('Admin')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}