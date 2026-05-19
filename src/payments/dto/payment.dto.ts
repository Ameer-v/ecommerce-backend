import { IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  method: string;
}