import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({ description: 'Nama kategori' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Slug kategori (huruf kecil, angka, dan strip)', example: 'elektronik-murah' })
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug hanya boleh berisi huruf kecil, angka, dan strip (-)',
  })
  slug: string;

  @ApiPropertyOptional({ description: 'Deskripsi kategori' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}