/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { createMockPrismaService } from 'src/common/mocks/prisma.mock';
import { StripeService } from 'src/common/services/stripe/stripe.service';
import { NotificationsProducer } from 'src/notifications/notifications.producer';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  Delivery,
  Inventory,
  Order,
  Payment,
  Prisma,
  UserLike,
} from '@prisma/client';
import Stripe from 'stripe';
import * as fixtures from './payment.service.fixtures';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockStripe: ReturnType<typeof fixtures.createMockStripeService>;
  let mockNotificationsProducer: ReturnType<
    typeof fixtures.createMockNotificationsProducer
  >;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockStripe = fixtures.createMockStripeService();
    mockNotificationsProducer = fixtures.createMockNotificationsProducer();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StripeService, useValue: mockStripe },
        { provide: NotificationsProducer, useValue: mockNotificationsProducer },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent and persist the payment record', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        fixtures.fakePendingOrder as Order,
      );
      mockStripe.createPaymentIntent.mockResolvedValue(
        fixtures.fakePaymentIntent,
      );
      mockPrisma.payment.create.mockResolvedValue(
        fixtures.fakePayment as Payment,
      );

      const result = await service.createPaymentIntent({
        orderId: 'oid1',
        amount: 9999,
        currency: 'usd',
      });

      expect(result.clientSecret).toBe('pi_secret_123');
      expect(result.paymentIntentId).toBe('pi_123');
      expect(mockPrisma.payment.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when order is not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent({
          orderId: 'oid1',
          amount: 9999,
          currency: 'usd',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order is not pending', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        ...fixtures.fakePendingOrder,
        status: 'paid',
      } as Order);

      await expect(
        service.createPaymentIntent({
          orderId: 'oid1',
          amount: 9999,
          currency: 'usd',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException when clientSecret is missing', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        fixtures.fakePendingOrder as Order,
      );
      mockStripe.createPaymentIntent.mockResolvedValue({
        ...fixtures.fakePaymentIntent,
        clientSecret: null,
      });

      await expect(
        service.createPaymentIntent({
          orderId: 'oid1',
          amount: 9999,
          currency: 'usd',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session and persist the payment record', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        fixtures.fakePendingOrder as Order,
      );
      mockStripe.createCheckoutSession.mockResolvedValue(
        fixtures.fakeCheckoutSession,
      );
      mockPrisma.payment.create.mockResolvedValue(
        fixtures.fakePayment as Payment,
      );

      const result = await service.createCheckoutSession({
        orderId: 'oid1',
        items: [
          {
            currency: 'usd',
            unitAmount: 9999,
            productName: 'Widget',
            quantity: 1,
          },
        ],
      });

      expect(result.url).toBe('https://checkout.stripe.com/session');
      expect(mockPrisma.payment.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when order is not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createCheckoutSession({ orderId: 'oid1', items: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order is not pending', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        ...fixtures.fakePendingOrder,
        status: 'paid',
      } as Order);

      await expect(
        service.createCheckoutSession({ orderId: 'oid1', items: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException when checkout session fields are missing', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        fixtures.fakePendingOrder as Order,
      );
      mockStripe.createCheckoutSession.mockResolvedValue({
        ...fixtures.fakeCheckoutSession,
        url: null,
      });

      await expect(
        service.createCheckoutSession({ orderId: 'oid1', items: [] }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('handleWebhook', () => {
    it('should handle payment_intent.succeeded and update payment and order status', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123' } },
      } as Stripe.Event;

      mockPrisma.payment.update.mockResolvedValue({} as Payment);
      mockPrisma.order.update.mockResolvedValue(
        fixtures.fakePaidOrder as unknown as Order,
      );

      await expect(service.handleWebhook(event)).resolves.not.toThrow();
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { paymentId: 'pi_123' },
        data: { status: 'succeeded' },
      });
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'paid' } }),
      );
    });

    it('should handle checkout.session.completed and update payment and order status', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_123' } },
      } as Stripe.Event;

      mockPrisma.payment.update.mockResolvedValue({} as Payment);
      mockPrisma.order.update.mockResolvedValue(
        fixtures.fakePaidOrder as unknown as Order,
      );

      await expect(service.handleWebhook(event)).resolves.not.toThrow();
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { paymentId: 'cs_123' },
        data: { status: 'complete' },
      });
    });

    it('should throw InternalServerErrorException for unrecognized event types', async () => {
      const event = {
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi_123' } },
      } as Stripe.Event;

      await expect(service.handleWebhook(event)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should create a delivery and decrement stock when order has an address', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123' } },
      } as Stripe.Event;

      const orderWithAddress = {
        orderId: 'oid1',
        addressId: 'adrid1',
        products: [
          { inventoryId: 'invid1', amount: 2, products: { productId: 'pid1' } },
        ],
      };

      const updatedInventory = {
        inventoryId: 'invid1',
        stock: 10,
        productId: 'pid1',
        product: { name: 'Widget', images: [] },
      };

      mockPrisma.payment.update.mockResolvedValue({} as Payment);
      mockPrisma.order.update.mockResolvedValue(
        orderWithAddress as unknown as Order,
      );
      mockPrisma.inventory.update.mockResolvedValue(
        updatedInventory as unknown as Inventory,
      );
      mockPrisma.delivery.create.mockResolvedValue({} as unknown as Delivery);

      await expect(service.handleWebhook(event)).resolves.not.toThrow();
      expect(mockPrisma.delivery.create).toHaveBeenCalledWith({
        data: { orderId: 'oid1', addressId: 'adrid1' },
      });
    });

    it('should notify users when total stock falls to 3 or below', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123' } },
      } as Stripe.Event;

      const orderWithAddress = {
        orderId: 'oid1',
        addressId: 'adrid1',
        products: [
          { inventoryId: 'invid1', amount: 2, products: { productId: 'pid1' } },
        ],
      };

      const lowStockInventory = {
        inventoryId: 'invid1',
        stock: 2,
        productId: 'pid1',
        product: {
          name: 'Widget',
          images: [{ url: 'http://example.com/img.jpg' }],
        },
      };

      mockPrisma.payment.update.mockResolvedValue({} as Payment);
      mockPrisma.order.update.mockResolvedValue(
        orderWithAddress as unknown as Order,
      );
      mockPrisma.inventory.update.mockResolvedValue(
        lowStockInventory as unknown as Inventory,
      );
      mockPrisma.inventory.aggregate.mockResolvedValue({
        _sum: { stock: 2 },
      } as Prisma.GetInventoryAggregateType<Prisma.InventoryAggregateArgs>);
      mockPrisma.userLike.findMany.mockResolvedValue([
        { user: { email: 'fan@example.com' } },
      ] as unknown as UserLike[]);
      mockPrisma.delivery.create.mockResolvedValue({} as Delivery);

      await expect(service.handleWebhook(event)).resolves.not.toThrow();
      expect(mockNotificationsProducer.notifyLowStock).toHaveBeenCalledWith(
        expect.objectContaining({
          productName: 'Widget',
          stock: 2,
          userEmails: ['fan@example.com'],
        }),
      );
    });
  });
});
