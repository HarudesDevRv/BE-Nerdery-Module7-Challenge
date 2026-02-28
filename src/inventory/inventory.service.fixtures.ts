import { Inventory, Product, Store } from '@prisma/client';
import { CreateInventoryInput } from './dto/create-inventory.input';

type RawInventory = Omit<Inventory, 'price' | 'salePrice'> & {
  price: number;
  salePrice: number;
  product: Partial<Product>;
};

export const fakeStore: Partial<Store> = {
  storeId: 'sid1',
  name: 'Main Store',
};

export const fakeProduct: Partial<Product> = {
  productId: 'pid1',
  managerId: 'mid1',
  name: 'Widget',
};

export const fakeProductOtherManager: Partial<Product> = {
  productId: 'pid1',
  managerId: 'mid2',
  name: 'Widget',
};

export const fakeRawInventory: RawInventory = {
  inventoryId: 'invid1',
  productId: 'pid1',
  storeId: 'sid1',
  price: 10.0,
  salePrice: 8.99,
  stock: 50,
  isActive: true,
  deletedAt: null,
  product: fakeProduct,
};

export const fakeInventoryWithOtherManager: RawInventory = {
  ...fakeRawInventory,
  product: fakeProductOtherManager,
};

export const createInventoryInput: CreateInventoryInput = {
  productId: 'pid1',
  storeId: 'sid1',
  price: 10.0,
  salePrice: 8.99,
  stock: 50,
  isActive: true,
};
