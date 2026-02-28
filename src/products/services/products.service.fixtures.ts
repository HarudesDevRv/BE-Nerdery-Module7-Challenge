import {
  Brand,
  Category,
  Image,
  Inventory,
  Prisma,
  Product,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';
import { CreateProductInput } from '../dto/create-product.input';
import { UpdateProductInput } from '../dto/update-product.input';

type ProductWithInventories = Partial<Product> & {
  inventories: Partial<Inventory>[];
  category: Partial<Category>;
  brand: Partial<Brand>;
  _count: { userLikes: number };
};

export const productCreateInput: CreateProductInput = {
  name: 'Widget 2',
  description: 'A widget 2',
  brandId: 'bid2',
  categoryId: 'cid2',
};

export const fakeProduct: ProductWithInventories = {
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
} satisfies Prisma.ProductGetPayload<{
  select: {
    productId: true;
    category: { select: { name: true } };
    brand: { select: { name: true } };
    name: true;
    description: true;
    inventories: {
      select: {
        price: true;
        stock: true;
        salePrice: true;
        inventoryId: true;
      };
    };
    _count: {
      select: { userLikes: true };
    };
  };
}>;

export const fakeManagerProduct: Partial<Product> = {
  managerId: 'mid1',
  productId: 'pid1',
  name: 'Widget',
  description: 'A widget',
  categoryId: 'cid1',
  brandId: 'bid1',
};

export const fakeImage: Partial<Image> = {
  imageId: 'iid1',
  productId: 'pid1',
  url: 'http://example.com/image.jpg',
  deletedAt: null,
};

export const fakeImageWithProduct: Partial<Image> & {
  product: Partial<Product>;
} = {
  ...fakeImage,
  product: { managerId: 'mid1' },
};

export const fakeCreatedManagerProduct: Partial<Product> = {
  productId: 'pid1',
  managerId: 'mid1',
  name: 'Widget 2',
  description: 'A widget 2',
  brandId: 'bid2',
  categoryId: 'cid2',
  isActive: true,
};

export const updateInput: Partial<UpdateProductInput> = {
  name: 'Widget 2',
  description: 'A widget 2',
  brandId: 'bid2',
  categoryId: 'cid2',
  isActive: false,
};

export const fakeUpdatedManagerProduct: Partial<Product> = {
  productId: 'pid1',
  managerId: 'mid1',
  name: 'Widget 2',
  description: 'A widget 2',
  brandId: 'bid2',
  categoryId: 'cid2',
  isActive: false,
};
