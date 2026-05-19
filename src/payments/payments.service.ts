import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async pay(userId: string, dto: CreatePaymentDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
    });

    if (!order) throw new NotFoundException('Order tidak ditemukan');
    if (order.status !== 'pending') {
      throw new BadRequestException('Order sudah diproses sebelumnya');
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          orderId: dto.orderId,
          method: dto.method,
          status: 'paid',
          amount: order.totalAmount,
          paidAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: dto.orderId },
        data: { status: 'paid' },
      });

      await tx.transactionLog.create({
        data: {
          orderId: dto.orderId,
          event: 'PAYMENT_SUCCESS',
          note: `Pembayaran berhasil via ${dto.method}`,
        },
      });

      return newPayment;
    });

    return { message: 'Pembayaran berhasil', payment };
  }

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException('Payment tidak ditemukan');
    return payment;
  }
}