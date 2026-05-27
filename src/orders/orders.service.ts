import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // Security: All stock checks and mutations inside a single transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        throw new BadRequestException('Keranjang belanja kosong');
      }

      // Security: Stock check INSIDE transaction to prevent race condition
      for (const item of cartItems) {
        if (item.product.stock < item.quantity) {
          throw new BadRequestException(
            `Stok ${item.product.name} tidak mencukupi (tersedia: ${item.product.stock}, diminta: ${item.quantity})`,
          );
        }
      }

      const totalAmount = cartItems.reduce((sum, item) => {
        return sum + Number(item.product.price) * item.quantity;
      }, 0);

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

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { orderedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          orderItems: { include: { product: true } },
          payment: true,
        },
      }),
      this.prisma.order.count(),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMyOrders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { orderedAt: 'desc' },
        include: {
          orderItems: { include: { product: true } },
          payment: true,
          transactionLogs: true,
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string, userRole: string) {
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

    // Security: Only allow owner or Admin to view order details
    if (order.userId !== userId && userRole !== 'Admin') {
      throw new ForbiddenException('Anda tidak memiliki akses ke order ini');
    }

    return order;
  }

  async updateStatus(id: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order tidak ditemukan');

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