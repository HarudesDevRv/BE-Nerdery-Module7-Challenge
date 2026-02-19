import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { UpdateDeliveryInput } from './dto/update-delivery.input';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async findByOrder(_orderId: string) {
    // TODO: find delivery by order id
  }

  async findAssigned(_deliveryPersonId: string) {
    // TODO: list deliveries assigned to delivery person
  }

  async updateStatus(_deliveryId: string, _input: UpdateDeliveryInput) {
    // TODO: update delivery status
  }

  async assign(_deliveryId: string, _deliveryPersonId: string) {
    // TODO: assign delivery person
  }
}
