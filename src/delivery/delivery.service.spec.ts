/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryService } from './delivery.service';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { createMockPrismaService } from 'src/common/mocks/prisma.mock';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Delivery, DeliveryStatus, Order, User } from '@prisma/client';
import * as fixtures from './delivery.service.fixtures';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByOrder', () => {
    it('should return the delivery for a given order', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue(
        fixtures.fakeDelivery as Delivery,
      );

      const result = await service.findByOrder('oid1');

      expect(result).toEqual(fixtures.fakeDelivery);
    });

    it('should return null when no delivery exists for the order', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue(null);

      const result = await service.findByOrder('oid1');

      expect(result).toBeNull();
    });
  });

  describe('findAssigned', () => {
    it('should return deliveries assigned to the delivery person', async () => {
      mockPrisma.delivery.findMany.mockResolvedValue([
        fixtures.fakeDelivery as Delivery,
      ]);

      const result = await service.findAssigned('dpid1');

      expect(result).toEqual([fixtures.fakeDelivery]);
    });
  });

  describe('updateStatus', () => {
    it('should update and return the delivery with the new status', async () => {
      const updatedDelivery = {
        ...fixtures.fakeDelivery,
        status: DeliveryStatus.delivered,
      };
      mockPrisma.delivery.update.mockResolvedValue(updatedDelivery as Delivery);

      const result = await service.updateStatus(
        'did1',
        fixtures.updateDeliveryInput,
      );

      expect(result).toEqual(updatedDelivery);
    });
  });

  describe('completeDelivery', () => {
    it('should mark the delivery and its order as delivered', async () => {
      const completedDelivery = {
        ...fixtures.fakeDelivery,
        status: 'delivered',
      };
      mockPrisma.delivery.findUnique.mockResolvedValue(
        fixtures.fakeDelivery as Delivery,
      );
      mockPrisma.delivery.update.mockResolvedValue(
        completedDelivery as unknown as Delivery,
      );
      mockPrisma.order.update.mockResolvedValue({} as Order);

      const result = await service.completeDelivery('did1');

      expect(result).toEqual(completedDelivery);
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { orderId: fixtures.fakeDelivery.orderId },
        data: { status: 'delivered' },
      });
    });

    it('should throw NotFoundException when delivery is not found', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue(null);

      await expect(service.completeDelivery('did1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assign', () => {
    it('should assign a delivery person and update the order status to shipped', async () => {
      const assignedDelivery = {
        ...fixtures.fakeDelivery,
        deliveryPersonId: 'dpid1',
      };
      mockPrisma.user.findUnique.mockResolvedValue(
        fixtures.fakeDeliveryPerson as User,
      );
      mockPrisma.delivery.findUnique.mockResolvedValue(
        fixtures.fakeDeliveryWithOrder as unknown as Delivery,
      );
      mockPrisma.delivery.update.mockResolvedValue(
        assignedDelivery as Delivery,
      );
      mockPrisma.order.update.mockResolvedValue({} as Order);

      const result = await service.assign('did1', 'dpid1');

      expect(result).toEqual(assignedDelivery);
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { orderId: fixtures.fakeDelivery.orderId },
        data: { status: 'shipped' },
      });
    });

    it('should throw BadRequestException when the user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.assign('did1', 'uid1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when the user is not a delivery person', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(
        fixtures.fakeRegularUser as User,
      );

      await expect(service.assign('did1', 'uid1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when delivery is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(
        fixtures.fakeDeliveryPerson as User,
      );
      mockPrisma.delivery.findUnique.mockResolvedValue(null);

      await expect(service.assign('did1', 'dpid1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when order is not in processing status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(
        fixtures.fakeDeliveryPerson as User,
      );
      mockPrisma.delivery.findUnique.mockResolvedValue(
        fixtures.fakeDeliveryWithNonProcessingOrder as unknown as Delivery,
      );

      await expect(service.assign('did1', 'dpid1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
