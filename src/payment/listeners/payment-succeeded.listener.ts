import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { NotificationsProducer } from '../../notifications/notifications.producer';
import { PaymentSucceededEvent } from '../events/payment-succeeded.event';

@Injectable()
export class PaymentSucceededListener {
  private readonly logger = new Logger(PaymentSucceededListener.name);

  constructor(
    private prisma: PrismaService,
    private notificationsProducer: NotificationsProducer,
  ) {}

  @OnEvent('payment.succeeded', { async: true })
  async handlePaymentSucceeded(event: PaymentSucceededEvent): Promise<void> {
    this.logger.log(`Handling payment.succeeded for orderId: ${event.orderId}`);

    for (const item of event.products) {
      await this.decrementStockAndNotify(item.inventoryId, item.amount);
    }

    await this.prisma.delivery.create({
      data: {
        orderId: event.orderId,
        addressId: event.addressId,
      },
    });

    this.logger.log(`Delivery created for orderId: ${event.orderId}`);
  }

  private async decrementStockAndNotify(
    inventoryId: string,
    amount: number,
  ): Promise<void> {
    const updatedInventory = await this.prisma.inventory.update({
      where: { inventoryId },
      data: { stock: { decrement: amount } },
      include: {
        product: { include: { images: true } },
      },
    });

    if (updatedInventory.stock <= 3) {
      const { _sum } = await this.prisma.inventory.aggregate({
        where: { productId: updatedInventory.productId },
        _sum: { stock: true },
      });
      const totalStock = _sum.stock ?? 0;

      if (totalStock <= 3) {
        const likes = await this.prisma.userLike.findMany({
          where: {
            productId: updatedInventory.productId,
            isActive: true,
            user: {
              orders: {
                none: {
                  status: {
                    in: ['paid', 'processing', 'shipped', 'delivered'],
                  },
                  products: {
                    some: {
                      products: {
                        productId: updatedInventory.productId,
                      },
                    },
                  },
                },
              },
            },
          },
          include: { user: true },
        });

        await this.notificationsProducer.notifyLowStock({
          productName: updatedInventory.product.name,
          stock: totalStock,
          userEmails: likes.map((like) => like.user.email),
          productImageUrl:
            updatedInventory.product.images.length > 0
              ? updatedInventory.product.images[0].url
              : null,
        });

        this.logger.log(
          `Low-stock notification queued for productId: ${updatedInventory.productId} (stock: ${totalStock})`,
        );
      }
    }
  }
}
