import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'Alamat pengiriman' })
  @IsString()
  @MaxLength(500)
  shippingAddress: string;
}