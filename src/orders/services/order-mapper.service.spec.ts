import { Test, TestingModule } from '@nestjs/testing';
import { OrderMapperService } from './order-mapper.service';
import {
  fakeOrder,
  fakeOrderWithPayment,
  fakeCreatedOrder,
  fakeCreatedGuestOrder,
  fakeOrderId,
  fakePaymentId,
} from './orders.service.fixtures';

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

  it('should format an order without payment', () => {
    const result = service.formatOrder(fakeOrder);

    expect(result).toEqual({
      orderId: fakeOrderId,
      paymentId: undefined,
      paymentMethod: undefined,
      subtotal: 99.99,
      total: 99.99,
      createdAt: fakeOrder.createdAt,
      updatedAt: fakeOrder.updatedAt,
      status: fakeOrder.status,
    });
  });

  it('should format an order with payment', () => {
    const result = service.formatOrder(fakeOrderWithPayment);

    expect(result).toEqual({
      orderId: fakeOrderWithPayment.orderId,
      paymentId: fakePaymentId,
      paymentMethod: 'card',
      subtotal: 99.99,
      total: 99.99,
      createdAt: fakeOrderWithPayment.createdAt,
      updatedAt: fakeOrderWithPayment.updatedAt,
      status: fakeOrderWithPayment.status,
    });
  });

  it('should format a created order without guestEmail', () => {
    const subtotal = 179.98;
    const result = service.formatCreatedOrder(fakeCreatedOrder, subtotal);

    expect(result).toEqual({
      orderId: fakeOrderId,
      subtotal,
      total: subtotal,
      createdAt: fakeCreatedOrder.createdAt,
      updatedAt: fakeCreatedOrder.updatedAt,
    });
  });

  it('should format a created guest order with guestEmail', () => {
    const subtotal = 89.99;
    const result = service.formatCreatedOrder(fakeCreatedGuestOrder, subtotal);

    expect(result).toEqual({
      orderId: fakeOrderId,
      guestEmail: 'guest@example.com',
      subtotal,
      total: subtotal,
      createdAt: fakeCreatedGuestOrder.createdAt,
      updatedAt: fakeCreatedGuestOrder.updatedAt,
    });
  });
});
