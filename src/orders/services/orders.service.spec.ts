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
import { Cart, Inventory, Order, OrderStatus, User } from '@prisma/client';
import * as fixtures from './orders.service.fixtures';

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
      mockPrisma.order.findMany.mockResolvedValue([fixtures.fakeOrder]);

      const orders = await service.findAllByUser(
        'uid1',
        fixtures.orderFilterInput,
      );

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

    it('Should retrieve orders of a user filtered by status', async () => {
      mockPrisma.order.findMany.mockResolvedValue([fixtures.fakeOrder]);

      const orders = await service.findAllByUser(
        'uid1',
        fixtures.orderFilterWithStatus,
      );

      expect(orders).toHaveLength(1);
    });

    it('Should retrieve orders of a user filtered by date range', async () => {
      mockPrisma.order.findMany.mockResolvedValue([fixtures.fakeOrder]);

      const orders = await service.findAllByUser(
        'uid1',
        fixtures.orderFilterWithDates,
      );

      expect(orders).toHaveLength(1);
    });

    it('Should retrieve orders of a user filtered by total range', async () => {
      mockPrisma.order.findMany.mockResolvedValue([fixtures.fakeOrder]);

      const orders = await service.findAllByUser(
        'uid1',
        fixtures.orderFilterWithTotal,
      );

      expect(orders).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('Should retrieve all orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        fixtures.fakeOrderWithPayment,
      ]);

      const orders = await service.findAll(fixtures.orderFilterInput);

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

    it('Should retrieve all orders filtered by status', async () => {
      mockPrisma.order.findMany.mockResolvedValue([fixtures.fakeOrder]);

      const orders = await service.findAll(fixtures.orderFilterWithStatus);

      expect(orders).toHaveLength(1);
    });

    it('Should retrieve all orders filtered by date range', async () => {
      mockPrisma.order.findMany.mockResolvedValue([fixtures.fakeOrder]);

      const orders = await service.findAll(fixtures.orderFilterWithDates);

      expect(orders).toHaveLength(1);
    });

    it('Should retrieve all orders filtered by total range', async () => {
      mockPrisma.order.findMany.mockResolvedValue([fixtures.fakeOrder]);

      const orders = await service.findAll(fixtures.orderFilterWithTotal);

      expect(orders).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('Should retrieve a single order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(fixtures.fakeOrder);

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
      mockPrisma.order.findUnique.mockResolvedValue(fixtures.fakeOrder);

      await expect(service.findOne('oid1', 'uid2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('Should create an order from cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeCart as unknown as Cart,
      );
      mockPrisma.order.create.mockResolvedValue(
        fixtures.fakeCreatedOrder as Order,
      );

      const order = await service.create('uid1', fixtures.createOrderInput);

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

      await expect(
        service.create('uid1', fixtures.createOrderInput),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('Should throw BadRequestException when cart is empty', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeCartEmpty as unknown as Cart,
      );

      await expect(
        service.create('uid1', fixtures.createOrderInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('Should throw BadRequestException when cart has insufficient stock', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeCartInsufficientStock as unknown as Cart,
      );

      await expect(
        service.create('uid1', fixtures.createOrderInput),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createSingleItemOrder', () => {
    it('Should create a single item order', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventory as Inventory,
      );
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(
        fixtures.fakeUser as User,
      );
      mockPrisma.order.create.mockResolvedValue(
        fixtures.fakeCreatedSingleItemOrder as Order,
      );

      const order = await service.createSingleItemOrder(
        'uid1',
        fixtures.createSingleItemOrderInput,
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
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(
        fixtures.fakeUser as User,
      );

      await expect(
        service.createSingleItemOrder(
          'uid1',
          fixtures.createSingleItemOrderInput,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw NotFoundException when inventory is inactive on single item order', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventoryInactive as Inventory,
      );
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(
        fixtures.fakeUser as User,
      );

      await expect(
        service.createSingleItemOrder(
          'uid1',
          fixtures.createSingleItemOrderInput,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw NotFoundException when inventory is deleted on single item order', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventoryDeleted as Inventory,
      );
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(
        fixtures.fakeUser as User,
      );

      await expect(
        service.createSingleItemOrder(
          'uid1',
          fixtures.createSingleItemOrderInput,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw BadRequestException when inventory is out of stock on single item order', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventoryOutOfStock as Inventory,
      );
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(
        fixtures.fakeUser as User,
      );

      await expect(
        service.createSingleItemOrder(
          'uid1',
          fixtures.createSingleItemOrderInput,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createGuestOrder', () => {
    it('Should create a guest order', async () => {
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventory as Inventory,
      );
      mockPrisma.order.create.mockResolvedValue(
        fixtures.fakeCreatedGuestOrder as Order,
      );

      const order = await service.createGuestOrder(
        fixtures.createGuestOrderInput,
      );

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
        service.createGuestOrder(fixtures.createGuestOrderInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw NotFoundException when inventory is inactive on guest order', async () => {
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventoryInactive as Inventory,
      );

      await expect(
        service.createGuestOrder(fixtures.createGuestOrderInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw BadRequestException when inventory is out of stock on guest order', async () => {
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventoryOutOfStock as Inventory,
      );

      await expect(
        service.createGuestOrder(fixtures.createGuestOrderInput),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processOrder', () => {
    it('Should process a paid order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        fixtures.fakeOrderForProcessing as Order,
      );
      mockPrisma.order.update.mockResolvedValue(
        fixtures.fakeProcessedOrder as Order,
      );

      const order = await service.processOrder('oid1');

      expect(order).toEqual(fixtures.fakeProcessedOrder);
    });

    it('Should throw NotFoundException for unknown order on processOrder', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.processOrder('oid1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Should throw BadRequestException when order is not paid on processOrder', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        fixtures.fakeOrderNotPaid as Order,
      );

      await expect(service.processOrder('oid1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
