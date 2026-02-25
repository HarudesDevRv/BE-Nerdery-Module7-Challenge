import { Decimal } from '@prisma/client/runtime/client';

export const mockPrismaService = {
  $transaction: jest.fn(),
  category: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  brand: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  product: {
    create: jest.fn(),
    update: jest.fn(),
  },
  deletedAtFilter: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    image: {
      findUnique: jest.fn(),
    },
  },
  user: { findUnique: jest.fn() },
  userLike: { upsert: jest.fn() },
  image: { create: jest.fn(), update: jest.fn() },
};

export const productCreateInput = {
  name: 'Widget 2',
  description: 'A widget 2',
  brandId: 'bid2',
  categoryId: 'cid2',
};

export const fakeProduct = {
  productId: 'pid1',
  name: 'Widget',
  description: 'A widget',
  category: { name: 'Gadgets' },
  brand: { name: 'Acme' },
  inventories: [
    {
      inventoryId: 'invid1',
      price: Decimal(9.99),
      salePrice: Decimal(7.99),
      stock: 5,
    },
  ],
  _count: { userLikes: 3 },
};

export const fakeManagerProduct = {
  managerId: 'mid1',
  productId: 'pid1',
  name: 'Widget',
  description: 'A widget',
  categoryId: 'cid1',
  brandId: 'bid1',
};

export const fakeImage = {
  imageId: 'iid1',
  productId: 'pid1',
  url: 'http://example.com/image.jpg',
  deletedAt: null,
};

export const fakeImageWithProduct = {
  ...fakeImage,
  product: { managerId: 'mid1' },
};
