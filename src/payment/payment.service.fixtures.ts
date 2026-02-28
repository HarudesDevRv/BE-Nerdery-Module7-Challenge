import { Order, Payment, Product } from '@prisma/client';

type PaymentIntent = {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
};

type CheckoutSession = {
  url: string;
  checkoutSessionId: string;
  amount: number;
  currency: string;
  status: string;
};

export const createMockStripeService = () => ({
  createPaymentIntent: jest.fn(),
  createCheckoutSession: jest.fn(),
});

export const createMockNotificationsProducer = () => ({
  notifyLowStock: jest.fn().mockResolvedValue(undefined),
});

export const fakePendingOrder: Partial<Order> = {
  orderId: 'oid1',
  status: 'pending',
  addressId: null,
};

export const fakePaidOrder: Partial<Order> & { products: Partial<Product>[] } =
  {
    orderId: 'oid1',
    status: 'paid',
    addressId: null,
    products: [],
  };

export const fakePaymentIntent: PaymentIntent = {
  clientSecret: 'pi_secret_123',
  paymentIntentId: 'pi_123',
  amount: 9999,
  currency: 'usd',
  status: 'requires_payment_method',
};

export const fakeCheckoutSession: CheckoutSession = {
  url: 'https://checkout.stripe.com/session',
  checkoutSessionId: 'cs_123',
  amount: 9999,
  currency: 'usd',
  status: 'open',
};

export const fakePayment: Partial<Payment> = {
  paymentId: 'pi_123',
  amount: 9999,
  currency: 'usd',
  status: 'requires_payment_method',
};
