import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/payment.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
@UseGuards(JwtGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Bayar order' })
  pay(@CurrentUser() user: any, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.pay(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lihat semua payment (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles('Admin')
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lihat payment by ID' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}