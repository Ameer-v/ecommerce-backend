import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Keranjang belanja kosong');
    }

    // Cek stok semua produk
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Stok ${item.product.name} tidak mencukupi`,
        );
      }
    }

    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    // Buat order dengan transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Buat order
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          shippingAddress: dto.shippingAddress,
          status: 'pending',
        },
      });

      // Buat order items
      await tx.orderItem.createMany({
        data: cartItems.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.product.price,
        })),
      });

      // Kurangi stok produk
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Catat transaction log
      await tx.transactionLog.create({
        data: {
          orderId: newOrder.id,
          event: 'ORDER_CREATED',
          note: `Order dibuat dengan total Rp ${totalAmount}`,
        },
      });

      // Hapus cart
      await tx.cartItem.deleteMany({ where: { userId } });

      return newOrder;
    });

    return {
      message: 'Order berhasil dibuat',
      order,
    };
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: { include: { product: true } },
        payment: true,
      },
    });
  }

  async findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: { include: { product: true } },
        payment: true,
        transactionLogs: true,
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: { include: { product: true } },
        payment: true,
        transactionLogs: true,
      },
    });

    if (!order) throw new NotFoundException('Order tidak ditemukan');
    return order;
  }

  async updateStatus(id: string, status: string) {
    const order = await this.findOne(id);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
    });

    await this.prisma.transactionLog.create({
      data: {
        orderId: id,
        event: 'STATUS_UPDATED',
        note: `Status diubah dari ${order.status} ke ${status}`,
      },
    });

    return { message: 'Status order diperbarui', order: updated };
  }
}