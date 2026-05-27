import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID Order yang akan dibayar' })
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Metode pembayaran',
    enum: ['cash', 'transfer_bank', 'e_wallet', 'qris'],
  })
  @IsIn(['cash', 'transfer_bank', 'e_wallet', 'qris'])
  method: string;
}