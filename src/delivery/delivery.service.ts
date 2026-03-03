import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { UpdateDeliveryInput } from './dto/update-delivery.input';
import { plainToInstance } from 'class-transformer';
import { Delivery } from './models/delivery.model';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);
  constructor(private prisma: PrismaService) {}

  async findByOrder(orderId: string) {
    this.logger.log(`Fetching delivery for orderId: ${orderId}`);
    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
    });
    return plainToInstance(Delivery, delivery, {
      excludeExtraneousValues: true,
    });
  }

  async findAssigned(deliveryPersonId: string) {
    this.logger.log(`Fetching assigned deliveries for deliveryPersonId: ${deliveryPersonId}`);
    const deliveries = await this.prisma.delivery.findMany({
      where: { deliveryPersonId, order: { status: 'shipped' } },
    });

    return deliveries.map((delivery) =>
      plainToInstance(Delivery, delivery, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async updateStatus(deliveryId: string, input: UpdateDeliveryInput) {
    this.logger.log(`Updating status for deliveryId: ${deliveryId}`);
    const updatedDelivery = await this.prisma.delivery.update({
      where: { deliveryId },
      data: {
        status: input.status ?? undefined,
        estimatedAt: input.estimatedDelivery ?? undefined,
      },
    });

    return plainToInstance(Delivery, updatedDelivery, {
      excludeExtraneousValues: true,
    });
  }

  async completeDelivery(deliveryId: string, deliveryPersonId: string) {
    this.logger.log(`Completing deliveryId: ${deliveryId} by deliveryPersonId: ${deliveryPersonId}`);
    const delivery = await this.prisma.delivery.findUnique({
      where: { deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.deliveryPersonId !== deliveryPersonId) {
      throw new ForbiddenException("Can't access this order");
    }

    const updatedDelivery = await this.prisma.delivery.update({
      where: { deliveryId },
      data: { status: 'delivered' },
    });

    await this.prisma.order.update({
      where: { orderId: delivery.orderId },
      data: { status: 'delivered' },
    });

    this.logger.log(`Delivery ${deliveryId} marked as delivered`);
    return plainToInstance(Delivery, updatedDelivery, {
      excludeExtraneousValues: true,
    });
  }

  async assign(deliveryId: string, deliveryPersonId: string) {
    this.logger.log(`Assigning deliveryId: ${deliveryId} to deliveryPersonId: ${deliveryPersonId}`);
    const deliveryPerson = await this.prisma.user.findUnique({
      where: { userId: deliveryPersonId },
    });

    if (!deliveryPerson || deliveryPerson.role != 'delivery_person') {
      throw new BadRequestException('The user is not a delivery person');
    }

    const delivery = await this.prisma.delivery.findUnique({
      where: { deliveryId },
      include: { order: true },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.order.status !== 'processing') {
      throw new BadRequestException(
        'Delivery can only be assigned when the order status is processing',
      );
    }

    const updatedDelivery = await this.prisma.delivery.update({
      where: { deliveryId },
      data: { deliveryPersonId },
    });

    await this.prisma.order.update({
      where: { orderId: delivery.orderId },
      data: { status: 'shipped' },
    });

    this.logger.log(`Delivery ${deliveryId} assigned to deliveryPersonId: ${deliveryPersonId}`);
    return plainToInstance(Delivery, updatedDelivery, {
      excludeExtraneousValues: true,
    });
  }
}
