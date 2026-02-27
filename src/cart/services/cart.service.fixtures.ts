import { Decimal } from '@prisma/client/runtime/client';

export const fakeUserId = 'uid1';
export const fakeCartId = 'cartid1';
export const fakeInventoryId = 'invid1';

export const addToCartInput = {
  inventoryId: fakeInventoryId,
  amount: 2,
};

export const updateCartItemInput = {
  inventoryId: fakeInventoryId,
  amount: 3,
};

export const fakeUserCart = {
  cartId: fakeCartId,
  userId: fakeUserId,
};

export const fakeInventory = {
  inventoryId: fakeInventoryId,
  isActive: true,
  stock: 10,
  salePrice: Decimal(29.99),
  deletedAt: null,
};

export const fakeInventoryInactive = {
  ...fakeInventory,
  isActive: false,
};

export const fakeInventoryOutOfStock = {
  ...fakeInventory,
  stock: 1, // less than amounts requested (2 and 3)
};

const fakeCartProduct = {
  cartItemId: 'cartitemid1',
  inventoryId: fakeInventoryId,
  amount: 2,
  inventory: {
    inventoryId: fakeInventoryId,
    salePrice: Decimal(29.99),
    product: {
      productId: 'pid1',
      name: 'Awesome Product',
    },
  },
};

export const fakeRawCart = {
  cartId: fakeCartId,
  userId: fakeUserId,
  products: [fakeCartProduct],
};

export const fakeRawCartEmpty = {
  cartId: fakeCartId,
  userId: fakeUserId,
  products: [],
};

export const fakeCartItemWithCart = {
  cartItemId: 'cartitemid1',
  cartId: fakeCartId,
  inventoryId: fakeInventoryId,
  amount: 2,
  cart: fakeRawCart,
};

export const fakeFormattedCart = {
  cartId: fakeCartId,
  total: 59.98,
  items: [
    {
      productId: 'pid1',
      productName: 'Awesome Product',
      amount: 2,
      unitPrice: 29.99,
      subtotal: 59.98,
    },
  ],
};

export const fakeFormattedEmptyCart = {
  cartId: fakeCartId,
  total: 0,
  items: [],
};
