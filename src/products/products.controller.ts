import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductDto } from './dto/product.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Lihat semua produk' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lihat produk by ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buat produk baru (Admin only)' })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('Admin')
  create(@Body() dto: ProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update produk (Admin only)' })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('Admin')
  update(@Param('id') id: string, @Body() dto: ProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Hapus produk (Admin only)' })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('Admin')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}