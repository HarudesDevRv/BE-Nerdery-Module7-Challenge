import { Decimal } from '@prisma/client/runtime/client';
import {
  Cart,
  Inventory,
  Order,
  OrderProduct,
  OrderStatus,
  Product,
  User,
} from '@prisma/client';
import { OrderFilterInput } from '../dto/order-filter.input';
import { CreateOrderInput } from '../dto/create-order.input';
import { CreateSingleItemOrderInput } from '../dto/create-single-item-order.input';
import { CreateGuestOrderInput } from '../dto/create-guest-order.input';

type OrderProductWithData = Partial<OrderProduct> & {
  inventory: Partial<Inventory> & { product: Partial<Product> };
};

type OrderWithPayment = Partial<Order> & {
  payment: { paymentMethod: string } | null;
};

type CartWithProducts = Partial<Cart> & {
  user: Partial<User>;
  products: OrderProductWithData[];
};

export const orderFilterInput: Partial<OrderFilterInput> = {
  offset: 0,
  limit: 10,
};

export const orderFilterWithStatus: Partial<OrderFilterInput> = {
  ...orderFilterInput,
  status: OrderStatus.pending,
};

export const orderFilterWithDates: Partial<OrderFilterInput> = {
  ...orderFilterInput,
  fromDate: new Date('2025-01-01'),
  toDate: new Date('2025-12-31'),
};

export const orderFilterWithTotal: Partial<OrderFilterInput> = {
  ...orderFilterInput,
  minTotal: 10,
  maxTotal: 200,
};

export const fakeOrder: OrderWithPayment = {
  orderId: 'oid1',
  userId: 'uid1',
  guestEmail: null,
  paymentId: null,
  addressId: 'addrid1',
  status: OrderStatus.pending,
  currency: 'USD',
  subtotal: Decimal(99.99),
  total: Decimal(99.99),
  createdAt: new Date('2025-06-15'),
  updatedAt: new Date('2025-06-15'),
  payment: null,
  deletedAt: null,
};

export const fakeOrderWithPayment: OrderWithPayment = {
  ...fakeOrder,
  orderId: 'oid2',
  paymentId: 'payid1',
  status: OrderStatus.paid,
  payment: { paymentMethod: 'card' },
};

export const fakeOrderList: OrderWithPayment[] = [
  fakeOrder,
  fakeOrderWithPayment,
];

export const fakeOrderPaid: OrderWithPayment = {
  ...fakeOrder,
  paymentId: 'payid1',
  status: OrderStatus.paid,
};

export const createOrderInput: Partial<CreateOrderInput> = {
  currency: 'USD',
};

export const createOrderInputWithAddress: Partial<CreateOrderInput> = {
  currency: 'USD',
  addressId: 'addrid1',
};

export const fakeCart: CartWithProducts = {
  cartId: 'cartid1',
  userId: 'uid1',
  user: { userId: 'uid1', addressId: 'addrid1' },
  products: [
    {
      inventoryId: 'invid1',
      amount: 2,
      inventory: {
        inventoryId: 'invid1',
        stock: 10,
        price: Decimal(99.99),
        salePrice: Decimal(89.99),
        product: { name: 'Awesome Gadget' },
      },
    },
  ],
};

export const fakeCartEmpty: CartWithProducts = {
  ...fakeCart,
  products: [],
};

export const fakeCartInsufficientStock: CartWithProducts = {
  ...fakeCart,
  products: [
    {
      ...fakeCart.products[0],
      amount: 99,
      inventory: { ...fakeCart.products[0].inventory, stock: 1 },
    },
  ],
};

export const fakeCreatedOrder: Partial<Order> = {
  orderId: 'oid1',
  userId: 'uid1',
  guestEmail: null,
  addressId: 'addrid1',
  status: 'pending',
  currency: 'USD',
  subtotal: Decimal(179.98),
  total: Decimal(179.98),
  createdAt: new Date('2025-06-15'),
  updatedAt: new Date('2025-06-15'),
};

export const createSingleItemOrderInput: Partial<CreateSingleItemOrderInput> = {
  inventoryId: 'invid1',
  currency: 'USD',
};

export const fakeInventory: Partial<Inventory> = {
  inventoryId: 'invid1',
  isActive: true,
  stock: 5,
  price: Decimal(99.99),
  salePrice: Decimal(89.99),
  deletedAt: null,
};

export const fakeInventoryOutOfStock: Partial<Inventory> = {
  ...fakeInventory,
  stock: 0,
};

export const fakeInventoryInactive: Partial<Inventory> = {
  ...fakeInventory,
  isActive: false,
};

export const fakeInventoryDeleted: Partial<Inventory> = {
  ...fakeInventory,
  deletedAt: new Date('2025-01-01'),
};

export const fakeUser: Partial<User> = {
  userId: 'uid1',
  email: 'user@example.com',
  addressId: 'addrid1',
};

export const fakeCreatedSingleItemOrder: Partial<Order> = {
  orderId: 'oid1',
  userId: 'uid1',
  guestEmail: null,
  addressId: 'addrid1',
  status: 'pending',
  currency: 'USD',
  subtotal: Decimal(89.99),
  total: Decimal(89.99),
  createdAt: new Date('2025-06-15'),
  updatedAt: new Date('2025-06-15'),
};

export const createGuestOrderInput: Partial<CreateGuestOrderInput> = {
  inventoryId: 'invid1',
  email: 'guest@example.com',
  currency: 'USD',
  addressId: 'addrid1',
};

export const fakeCreatedGuestOrder: Partial<Order> = {
  orderId: 'oid1',
  userId: null,
  guestEmail: 'guest@example.com',
  addressId: 'addrid1',
  status: 'pending',
  currency: 'USD',
  subtotal: Decimal(89.99),
  total: Decimal(89.99),
  createdAt: new Date('2025-06-15'),
  updatedAt: new Date('2025-06-15'),
};

export const fakeOrderForProcessing: Partial<Order> = {
  orderId: 'oid1',
  userId: 'uid1',
  status: OrderStatus.paid,
  subtotal: Decimal(99.99),
  total: Decimal(99.99),
  createdAt: new Date('2025-06-15'),
  updatedAt: new Date('2025-06-15'),
};

export const fakeOrderNotPaid: Partial<Order> = {
  ...fakeOrderForProcessing,
  status: OrderStatus.pending,
};

export const fakeProcessedOrder: Partial<Order> = {
  ...fakeOrderForProcessing,
  status: OrderStatus.processing,
};
