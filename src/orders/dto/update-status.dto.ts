import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Status order',
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
  })
  @IsIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled'])
  status: string;
}
