import { Decimal } from '@prisma/client/runtime/client';
import { OrderStatus } from '@prisma/client';

export const fakeUserId = 'uid1';
export const fakeOrderId = 'oid1';
export const fakeInventoryId = 'invid1';
export const fakeAddressId = 'addrid1';
export const fakePaymentId = 'payid1';

export const orderFilterInput = {
  offset: 0,
  limit: 10,
};

export const orderFilterWithStatus = {
  offset: 0,
  limit: 10,
  status: OrderStatus.pending,
};

export const orderFilterWithDates = {
  offset: 0,
  limit: 10,
  fromDate: new Date('2025-01-01'),
  toDate: new Date('2025-12-31'),
};

export const orderFilterWithTotal = {
  offset: 0,
  limit: 10,
  minTotal: 10,
  maxTotal: 200,
};

export const fakeOrder = {
  orderId: fakeOrderId,
  userId: fakeUserId,
  guestEmail: null,
  paymentId: null,
  addressId: fakeAddressId,
  status: OrderStatus.pending,
  currency: 'USD',
  subtotal: Decimal(99.99),
  total: Decimal(99.99),
  createdAt: new Date('2025-06-15'),
  updatedAt: new Date('2025-06-15'),
  payment: null,
  deletedAt: null,
};

export const fakeOrderWithPayment = {
  ...fakeOrder,
  orderId: 'oid2',
  paymentId: fakePaymentId,
  status: OrderStatus.paid,
  payment: { paymentMethod: 'card' },
};

export const fakeOrderList = [fakeOrder, fakeOrderWithPayment];

export const fakeOrderPaid = {
  ...fakeOrder,
  paymentId: fakePaymentId,
  status: OrderStatus.paid,
};

export const createOrderInput = {
  currency: 'USD',
};

export const createOrderInputWithAddress = {
  currency: 'USD',
  addressId: fakeAddressId,
};

export const fakeCart = {
  cartId: 'cartid1',
  userId: fakeUserId,
  user: { userId: fakeUserId, addressId: fakeAddressId },
  products: [
    {
      cartItemId: 'cartitemid1',
      inventoryId: fakeInventoryId,
      amount: 2,
      inventory: {
        inventoryId: fakeInventoryId,
        stock: 10,
        price: Decimal(99.99),
        salePrice: Decimal(89.99),
        product: { name: 'Awesome Gadget' },
      },
    },
  ],
};

export const fakeCartEmpty = {
  ...fakeCart,
  products: [],
};

export const fakeCartInsufficientStock = {
  ...fakeCart,
  products: [
    {
      ...fakeCart.products[0],
      amount: 99,
      inventory: { ...fakeCart.products[0].inventory, stock: 1 },
    },
  ],
};

export const fakeCreatedOrder = {
  orderId: fakeOrderId,
  userId: fakeUserId,
  guestEmail: null,
  addressId: fakeAddressId,
  status: 'pending',
  currency: 'USD',
  subtotal: Decimal(179.98),
  total: Decimal(179.98),
  createdAt: new Date('2025-06-15'),
  updatedAt: new Date('2025-06-15'),
};

export const createSingleItemOrderInput = {
  inventoryId: fakeInventoryId,
  currency: 'USD',
};

export const fakeInventory = {
  inventoryId: fakeInventoryId,
  isActive: true,
  stock: 5,
  price: Decimal(99.99),
  salePrice: Decimal(89.99),
  deletedAt: null,
};

export const fakeInventoryOutOfStock = {
  ...fakeInventory,
  stock: 0,
};

export const fakeInventoryInactive = {
  ...fakeInventory,
  isActive: false,
};

export const fakeInventoryDeleted = {
  ...fakeInventory,
  deletedAt: new Date('2025-01-01'),
};

export const fakeUser = {
  userId: fakeUserId,
  email: 'user@example.com',
  addressId: fakeAddressId,
};

export const fakeCreatedSingleItemOrder = {
  orderId: fakeOrderId,
  userId: fakeUserId,
  guestEmail: null,
  addressId: fakeAddressId,
  status: 'pending',
  currency: 'USD',
  subtotal: Decimal(89.99),
  total: Decimal(89.99),
  createdAt: new Date('2025-06-15'),
  updatedAt: new Date('2025-06-15'),
};

export const createGuestOrderInput = {
  inventoryId: fakeInventoryId,
  email: 'guest@example.com',
  currency: 'USD',
  addressId: fakeAddressId,
};

export const fakeCreatedGuestOrder = {
  orderId: fakeOrderId,
  userId: null,
  guestEmail: 'guest@example.com',
  addressId: fakeAddressId,
  status: 'pending',
  currency: 'USD',
  subtotal: Decimal(89.99),
  total: Decimal(89.99),
  createdAt: new Date('2025-06-15'),
  updatedAt: new Date('2025-06-15'),
};

export const fakeOrderForProcessing = {
  orderId: fakeOrderId,
  userId: fakeUserId,
  status: OrderStatus.paid,
  subtotal: Decimal(99.99),
  total: Decimal(99.99),
  createdAt: new Date('2025-06-15'),
  updatedAt: new Date('2025-06-15'),
};

export const fakeOrderNotPaid = {
  ...fakeOrderForProcessing,
  status: OrderStatus.pending,
};

export const fakeProcessedOrder = {
  ...fakeOrderForProcessing,
  status: OrderStatus.processing,
};
