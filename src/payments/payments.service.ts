import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { paidAt: 'desc' },
        include: {
          order: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      this.prisma.payment.count(),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string, userRole: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment tidak ditemukan');

    // Security: Only owner or Admin can view payment details
    if (payment.order.userId !== userId && userRole !== 'Admin') {
      throw new ForbiddenException('Anda tidak memiliki akses ke payment ini');
    }

    return payment;
  }
}