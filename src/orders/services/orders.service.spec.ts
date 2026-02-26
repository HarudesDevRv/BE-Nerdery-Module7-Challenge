/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { createMockPrismaService } from 'src/common/mocks/prisma.mock';
import { OrderMapperService } from './order-mapper.service';
import { CartService } from '../../cart/services/cart.service';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import {
  fakeOrder,
  fakeOrderWithPayment,
  orderFilterInput,
  createOrderInput,
  fakeCart,
  fakeCartEmpty,
  fakeCartInsufficientStock,
  fakeCreatedOrder,
  createSingleItemOrderInput,
  fakeInventory,
  fakeInventoryOutOfStock,
  fakeInventoryInactive,
  fakeInventoryDeleted,
  fakeUser,
  fakeCreatedSingleItemOrder,
  createGuestOrderInput,
  fakeCreatedGuestOrder,
  fakeOrderForProcessing,
  fakeProcessedOrder,
  fakeOrderNotPaid,
} from './orders.service.fixtures';

const createMockCartService = () => ({
  clearCart: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockCartService: ReturnType<typeof createMockCartService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockCartService = createMockCartService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        OrderMapperService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CartService, useValue: mockCartService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUser', () => {
    it('Should retrieve the paginated orders of a user', async () => {
      mockPrisma.order.findMany.mockResolvedValue([fakeOrder]);

      const orders = await service.findAllByUser('uid1', orderFilterInput);

      expect(orders).toEqual([
        {
          orderId: 'oid1',
          paymentId: undefined,
          paymentMethod: undefined,
          subtotal: 99.99,
          total: 99.99,
          status: OrderStatus.pending,
          createdAt: new Date('2025-06-15'),
          updatedAt: new Date('2025-06-15'),
        },
      ]);
    });
  });

  describe('findAll', () => {
    it('Should retrieve all orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([fakeOrderWithPayment]);

      const orders = await service.findAll(orderFilterInput);

      expect(orders).toEqual([
        {
          orderId: 'oid2',
          paymentId: 'payid1',
          paymentMethod: 'card',
          subtotal: 99.99,
          total: 99.99,
          status: OrderStatus.paid,
          createdAt: new Date('2025-06-15'),
          updatedAt: new Date('2025-06-15'),
        },
      ]);
    });
  });

  describe('findOne', () => {
    it('Should retrieve a single order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(fakeOrder);

      const order = await service.findOne('oid1', 'uid1');

      expect(order).toEqual({
        orderId: 'oid1',
        paymentId: undefined,
        paymentMethod: undefined,
        subtotal: 99.99,
        total: 99.99,
        status: OrderStatus.pending,
        createdAt: new Date('2025-06-15'),
        updatedAt: new Date('2025-06-15'),
      });
    });

    it('Should throw NotFoundException for unknown order on findOne', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne('oid1', 'uid1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Should throw ForbiddenException when accessing another user order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(fakeOrder);

      await expect(service.findOne('oid1', 'uid2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('Should create an order from cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(fakeCart as any);
      mockPrisma.order.create.mockResolvedValue(fakeCreatedOrder as any);

      const order = await service.create('uid1', createOrderInput);

      expect(order).toEqual({
        orderId: 'oid1',
        subtotal: 179.98,
        total: 179.98,
        createdAt: new Date('2025-06-15'),
        updatedAt: new Date('2025-06-15'),
      });
      expect(mockCartService.clearCart).toHaveBeenCalledWith('uid1');
    });

    it('Should throw InternalServerErrorException when cart is not found', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      await expect(service.create('uid1', createOrderInput)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('Should throw BadRequestException when cart is empty', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(fakeCartEmpty as any);

      await expect(service.create('uid1', createOrderInput)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Should throw BadRequestException when cart has insufficient stock', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fakeCartInsufficientStock as any,
      );

      await expect(service.create('uid1', createOrderInput)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createSingleItemOrder', () => {
    it('Should create a single item order', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(fakeInventory as any);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(fakeUser as any);
      mockPrisma.order.create.mockResolvedValue(
        fakeCreatedSingleItemOrder as any,
      );

      const order = await service.createSingleItemOrder(
        'uid1',
        createSingleItemOrderInput,
      );

      expect(order).toEqual({
        orderId: 'oid1',
        subtotal: 89.99,
        total: 89.99,
        createdAt: new Date('2025-06-15'),
        updatedAt: new Date('2025-06-15'),
      });
    });

    it('Should throw NotFoundException when inventory is not found on single item order', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(fakeUser as any);

      await expect(
        service.createSingleItemOrder('uid1', createSingleItemOrderInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw NotFoundException when inventory is inactive on single item order', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(
        fakeInventoryInactive as any,
      );
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(fakeUser as any);

      await expect(
        service.createSingleItemOrder('uid1', createSingleItemOrderInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw NotFoundException when inventory is deleted on single item order', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(
        fakeInventoryDeleted as any,
      );
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(fakeUser as any);

      await expect(
        service.createSingleItemOrder('uid1', createSingleItemOrderInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw BadRequestException when inventory is out of stock on single item order', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(
        fakeInventoryOutOfStock as any,
      );
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(fakeUser as any);

      await expect(
        service.createSingleItemOrder('uid1', createSingleItemOrderInput),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createGuestOrder', () => {
    it('Should create a guest order', async () => {
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fakeInventory as any,
      );
      mockPrisma.order.create.mockResolvedValue(fakeCreatedGuestOrder as any);

      const order = await service.createGuestOrder(createGuestOrderInput);

      expect(order).toEqual({
        orderId: 'oid1',
        guestEmail: 'guest@example.com',
        subtotal: 89.99,
        total: 89.99,
        createdAt: new Date('2025-06-15'),
        updatedAt: new Date('2025-06-15'),
      });
    });

    it('Should throw NotFoundException when inventory is not found on guest order', async () => {
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(null);

      await expect(
        service.createGuestOrder(createGuestOrderInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw NotFoundException when inventory is inactive on guest order', async () => {
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fakeInventoryInactive as any,
      );

      await expect(
        service.createGuestOrder(createGuestOrderInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw BadRequestException when inventory is out of stock on guest order', async () => {
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fakeInventoryOutOfStock as any,
      );

      await expect(
        service.createGuestOrder(createGuestOrderInput),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processOrder', () => {
    it('Should process a paid order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        fakeOrderForProcessing as any,
      );
      mockPrisma.order.update.mockResolvedValue(fakeProcessedOrder as any);

      const order = await service.processOrder('oid1');

      expect(order).toEqual(fakeProcessedOrder);
    });

    it('Should throw NotFoundException for unknown order on processOrder', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.processOrder('oid1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Should throw BadRequestException when order is not paid on processOrder', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(fakeOrderNotPaid as any);

      await expect(service.processOrder('oid1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
