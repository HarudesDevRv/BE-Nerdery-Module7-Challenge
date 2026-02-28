import { Cart, CartItem, Inventory, Product } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';
import { UpdateCartItemInput } from '../dto/update-cart-item.input';
import { AddToCartInput } from '../dto/add-to-cart.input';

type CartProduct = Partial<CartItem> & {
  inventory: Partial<Inventory> & { product: Partial<Product> };
};

type RawCart = Partial<Cart> & { products: Partial<CartProduct>[] };

type CartItemWithCart = Partial<CartItem> & { cart: Partial<Cart> };

type CartItemProduct = {
  productId: string;
  productName: string;
  amount: number;
  unitPrice: number;
  subtotal: number;
};

type FormattedCart = Partial<Cart> & {
  total: number;
  items: CartItemProduct[];
};

export const addToCartInput: AddToCartInput = {
  inventoryId: 'invid1',
  amount: 2,
};

export const updateCartItemInput: UpdateCartItemInput = {
  inventoryId: 'invid1',
  amount: 3,
};

export const fakeUserCart: Partial<Cart> = {
  cartId: 'cartid1',
  userId: 'uid1',
};

export const fakeInventory: Partial<Inventory> = {
  inventoryId: 'invid1',
  isActive: true,
  stock: 10,
  salePrice: Decimal(29.99),
  deletedAt: null,
};

export const fakeInventoryInactive: Partial<Inventory> = {
  ...fakeInventory,
  isActive: false,
};

export const fakeInventoryOutOfStock: Partial<Inventory> = {
  ...fakeInventory,
  stock: 1,
};

const fakeCartProduct: CartProduct = {
  inventoryId: 'invid1',
  amount: 2,
  inventory: {
    inventoryId: 'invid1',
    salePrice: Decimal(29.99),
    product: {
      productId: 'pid1',
      name: 'Awesome Product',
    },
  },
};

export const fakeRawCart: RawCart = {
  cartId: 'cartid1',
  userId: 'uid1',
  products: [fakeCartProduct],
};

export const fakeRawCartEmpty: RawCart = {
  cartId: 'cartid1',
  userId: 'uid1',
  products: [],
};

export const fakeCartItemWithCart: CartItemWithCart = {
  cartId: 'cartid1',
  inventoryId: 'invid1',
  amount: 2,
  cart: fakeRawCart,
};

export const fakeFormattedCart: FormattedCart = {
  cartId: 'cartid1',
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

export const fakeFormattedEmptyCart: FormattedCart = {
  cartId: 'cartid1',
  total: 0,
  items: [],
};
