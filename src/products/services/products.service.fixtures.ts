import { Decimal } from '@prisma/client/runtime/client';

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

export const fakeCreatedManagerProduct = {
  productId: 'pid1',
  managerId: 'mid1',
  name: 'Widget 2',
  description: 'A widget 2',
  brandId: 'bid2',
  categoryId: 'cid2',
  isACtive: true,
};

export const updateInput = {
  name: 'Widget 2',
  description: 'A widget 2',
  brandId: 'bid2',
  categoryId: 'cid2',
  isACtive: false,
};

export const fakeUpdatedManagerProduct = {
  productId: 'pid1',
  managerId: 'mid1',
  name: 'Widget 2',
  description: 'A widget 2',
  brandId: 'bid2',
  categoryId: 'cid2',
  isACtive: false,
};
