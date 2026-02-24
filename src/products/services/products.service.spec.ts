import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductMapperService } from './product-mapper.service';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';

const mockPrismaService = {
  $transaction: jest.fn(),
  category: {
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

const fakeProduct = {
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

const fakeManagerProduct = {
  managerId: 'mid1',
  productId: 'pid1',
  name: 'Widget',
  description: 'A widget',
  categoryId: 'cid1',
  brandId: 'bid1',
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        ProductMapperService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Should retrieve the category list', async () => {
    mockPrismaService.category.findMany.mockResolvedValue([
      { categoryId: 'cid1', name: 'Gadgets' },
    ]);

    const categories = await service.getCategories();

    expect(categories).toEqual([{ categoryId: 'cid1', name: 'Gadgets' }]);
  });

  it('Should return paginated products', async () => {
    mockPrismaService.$transaction.mockResolvedValue([[fakeProduct], 1]);

    const result = await service.findAll({});

    expect(result.items).toEqual([
      {
        productId: 'pid1',
        name: 'Widget',
        description: 'A widget',
        category: 'Gadgets',
        brand: 'Acme',
        inventoryId: 'invid1',
        price: 9.99,
        salePrice: 7.99,
        stock: 5,
        likesCount: 3,
      },
    ]);

    expect(result.pagination).toEqual({
      totalItems: 1,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
    });
  });

  it('Should return paginated manager products', async () => {
    mockPrismaService.$transaction.mockResolvedValue([[fakeManagerProduct], 1]);

    const result = await service.getByManagerId('mid1', {});

    expect(result.items).toEqual([
      {
        managerId: 'mid1',
        productId: 'pid1',
        name: 'Widget',
        description: 'A widget',
        categoryId: 'cid1',
        brandId: 'bid1',
      },
    ]);

    expect(result.pagination).toEqual({
      totalItems: 1,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
    });
  });

  it('Should return a formatted product', async () => {
    mockPrismaService.deletedAtFilter.product.findUnique.mockResolvedValue(
      fakeProduct,
    );

    const product = await service.findOne('pid1');

    expect(product).toEqual({
      productId: 'pid1',
      name: 'Widget',
      description: 'A widget',
      category: 'Gadgets',
      brand: 'Acme',
      inventoryId: 'invid1',
      price: 9.99,
      salePrice: 7.99,
      stock: 5,
      likesCount: 3,
    });
  });

  it('Should throw NotFoundException for unknown category', async () => {
    mockPrismaService.category.findUnique.mockResolvedValue(null);

    await expect(service.findAll({ category: 'Unknown' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should update a product', async () => {
    const updateInput = {
      name: 'Widget 2',
      description: 'A widget 2',
      brandId: 'bid2',
      categoryId: 'cid2',
      isACtive: false,
    };

    const fakeUpdatedManagerProduct = {
      productId: 'pid1',
      managerId: 'mid1',
      name: 'Widget 2',
      description: 'A widget 2',
      brandId: 'bid2',
      categoryId: 'cid2',
      isACtive: false,
    };

    mockPrismaService.deletedAtFilter.product.findUnique.mockResolvedValue(
      fakeManagerProduct,
    );

    mockPrismaService.deletedAtFilter.product.update.mockResolvedValue(
      fakeUpdatedManagerProduct,
    );

    const updatedProduct = await service.update('pid1', updateInput, 'mid1');

    expect(updatedProduct).toEqual({
      managerId: 'mid1',
      productId: 'pid1',
      name: 'Widget 2',
      description: 'A widget 2',
      brandId: 'bid2',
      categoryId: 'cid2',
      isACtive: false,
    });
  });

  it('Should throw NotFoundException for unknown product', async () => {
    mockPrismaService.deletedAtFilter.product.findUnique.mockResolvedValue(
      null,
    );

    await expect(service.update('pid2', {}, 'mid1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw ForbiddenException for unauthorized', async () => {
    mockPrismaService.deletedAtFilter.product.findUnique.mockResolvedValue(
      fakeManagerProduct,
    );

    await expect(service.update('pid1', {}, 'mid2')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
