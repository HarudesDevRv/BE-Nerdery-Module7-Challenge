import { Test, TestingModule } from '@nestjs/testing';
import { OrderMapperService } from './order-mapper.service';
import * as fixtures from './orders.service.fixtures';

describe('OrderMapperService', () => {
  let service: OrderMapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderMapperService],
    }).compile();

    service = module.get<OrderMapperService>(OrderMapperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('formatOrder', () => {
    it('should format an order without payment', () => {
      const result = service.formatOrder(fixtures.fakeOrder);

      expect(result).toEqual({
        orderId: 'oid1',
        paymentId: undefined,
        paymentMethod: undefined,
        subtotal: 99.99,
        total: 99.99,
        createdAt: fixtures.fakeOrder.createdAt,
        updatedAt: fixtures.fakeOrder.updatedAt,
        status: fixtures.fakeOrder.status,
      });
    });

    it('should format an order with payment', () => {
      const result = service.formatOrder(fixtures.fakeOrderWithPayment);

      expect(result).toEqual({
        orderId: fixtures.fakeOrderWithPayment.orderId,
        paymentId: 'payid1',
        paymentMethod: 'card',
        subtotal: 99.99,
        total: 99.99,
        createdAt: fixtures.fakeOrderWithPayment.createdAt,
        updatedAt: fixtures.fakeOrderWithPayment.updatedAt,
        status: fixtures.fakeOrderWithPayment.status,
      });
    });

    it('should map null paymentId to undefined', () => {
      const result = service.formatOrder(fixtures.fakeOrder);

      expect(result.paymentId).toBeUndefined();
    });

    it('should convert Decimal subtotal and total to numbers', () => {
      const result = service.formatOrder(fixtures.fakeOrder);

      expect(typeof result.subtotal).toBe('number');
      expect(typeof result.total).toBe('number');
    });
  });

  describe('formatCreatedOrder', () => {
    it('should format a created order without guestEmail', () => {
      const subtotal = 179.98;
      const result = service.formatCreatedOrder(
        fixtures.fakeCreatedOrder,
        subtotal,
      );

      expect(result).toEqual({
        orderId: 'oid1',
        subtotal,
        total: subtotal,
        createdAt: fixtures.fakeCreatedOrder.createdAt,
        updatedAt: fixtures.fakeCreatedOrder.updatedAt,
      });
    });

    it('should format a created guest order with guestEmail', () => {
      const subtotal = 89.99;
      const result = service.formatCreatedOrder(
        fixtures.fakeCreatedGuestOrder,
        subtotal,
      );

      expect(result).toEqual({
        orderId: 'oid1',
        guestEmail: 'guest@example.com',
        subtotal,
        total: subtotal,
        createdAt: fixtures.fakeCreatedGuestOrder.createdAt,
        updatedAt: fixtures.fakeCreatedGuestOrder.updatedAt,
      });
    });

    it('should set total equal to the provided subtotal', () => {
      const subtotal = 55.0;
      const result = service.formatCreatedOrder(
        fixtures.fakeCreatedOrder,
        subtotal,
      );

      expect(result.total).toBe(subtotal);
    });

    it('should omit guestEmail when it is null', () => {
      const result = service.formatCreatedOrder(fixtures.fakeCreatedOrder, 100);

      expect(result).not.toHaveProperty('guestEmail');
    });
  });
});
