import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { UpdateDeliveryInput } from './dto/update-delivery.input';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async findByOrder(orderId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
    });
    return delivery;
  }

  async findAssigned(deliveryPersonId: string) {
    const deliveries = await this.prisma.delivery.findMany({
      where: { deliveryPersonId, order: { status: 'shipped' } },
    });

    return deliveries;
  }

  async updateStatus(deliveryId: string, input: UpdateDeliveryInput) {
    const updatedDelivery = await this.prisma.delivery.update({
      where: { deliveryId },
      data: {
        status: input.status ?? undefined,
        estimatedAt: input.estimatedDelivery ?? undefined,
      },
    });

    return updatedDelivery;
  }

  async assign(deliveryId: string, deliveryPersonId: string) {
    const deliveryPerson = await this.prisma.user.findUnique({
      where: { userId: deliveryPersonId },
    });

    if (!deliveryPerson || deliveryPerson.role != 'delivery_person') {
      return new BadRequestException('The user is not a delivery person');
    }

    const updatedDelivery = await this.prisma.delivery.update({
      where: { deliveryId },
      data: { deliveryPersonId },
    });

    return updatedDelivery;
  }
}
