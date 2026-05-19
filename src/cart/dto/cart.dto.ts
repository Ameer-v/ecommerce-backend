import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}