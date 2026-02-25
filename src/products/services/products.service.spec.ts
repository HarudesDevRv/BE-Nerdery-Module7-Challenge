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

const productCreateInput = {
  name: 'Widget 2',
  description: 'A widget 2',
  brandId: 'bid2',
  categoryId: 'cid2',
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

  //Public categories retrieval

  it('Should retrieve the category list', async () => {
    mockPrismaService.category.findMany.mockResolvedValue([
      { categoryId: 'cid1', name: 'Gadgets' },
    ]);

    const categories = await service.getCategories();

    expect(categories).toEqual([{ categoryId: 'cid1', name: 'Gadgets' }]);
  });

  //Public products retrieval

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

  //Manager products retrieval

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

  //Public findOne

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

  //Product create

  it('Should create a product', async () => {
    const fakeCreatedManagerProduct = {
      productId: 'pid1',
      managerId: 'mid1',
      name: 'Widget 2',
      description: 'A widget 2',
      brandId: 'bid2',
      categoryId: 'cid2',
      isACtive: true,
    };
    mockPrismaService.category.findUnique.mockResolvedValue({
      categoryId: 'cid2',
    });
    mockPrismaService.brand.findUnique.mockResolvedValue({
      brandId: 'bid2',
    });

    mockPrismaService.product.create.mockResolvedValue(
      fakeCreatedManagerProduct,
    );

    const product = await service.create(productCreateInput, 'mid1');

    expect(product).toEqual({
      managerId: 'mid1',
      productId: 'pid1',
      name: 'Widget 2',
      description: 'A widget 2',
      brandId: 'bid2',
      categoryId: 'cid2',
      isACtive: true,
      images: [],
      inventories: [],
    });
  });

  it('Should throw NotFoundException for unknown category on product create', async () => {
    mockPrismaService.category.findUnique.mockResolvedValue(null);
    mockPrismaService.brand.findUnique.mockResolvedValue({
      brandId: 'bid2',
    });

    await expect(service.create(productCreateInput, 'mid1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw NotFoundException for unknown brand on product create', async () => {
    mockPrismaService.brand.findUnique.mockResolvedValue(null);
    mockPrismaService.category.findUnique.mockResolvedValue({
      categoryId: 'cid2',
    });

    await expect(service.create(productCreateInput, 'mid1')).rejects.toThrow(
      NotFoundException,
    );
  });

  //Product update

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
    mockPrismaService.category.findUnique.mockResolvedValue({
      categoryId: 'cid2',
    });
    mockPrismaService.brand.findUnique.mockResolvedValue({
      brandId: 'bid2',
    });

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

  it('Should throw NotFoundException for unknown product on product update', async () => {
    mockPrismaService.deletedAtFilter.product.findUnique.mockResolvedValue(
      null,
    );

    await expect(service.update('pid2', {}, 'mid1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw NotFoundException for unknown category on product update', async () => {
    mockPrismaService.category.findUnique.mockResolvedValue(null);
    mockPrismaService.brand.findUnique.mockResolvedValue({
      brandId: 'bid2',
    });

    await expect(service.update('pid2', {}, 'mid1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw NotFoundException for unknown brand on product update', async () => {
    mockPrismaService.brand.findUnique.mockResolvedValue(null);
    mockPrismaService.category.findUnique.mockResolvedValue({
      categoryId: 'cid2',
    });

    await expect(service.update('pid2', {}, 'mid1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw ForbiddenException for unauthorized operation on product update', async () => {
    mockPrismaService.deletedAtFilter.product.findUnique.mockResolvedValue(
      fakeManagerProduct,
    );

    await expect(service.update('pid1', {}, 'mid2')).rejects.toThrow(
      ForbiddenException,
    );
  });

  //Product delete

  it('Should soft delete a product', async () => {
    mockPrismaService.deletedAtFilter.product.findUnique.mockResolvedValue({
      ...fakeManagerProduct,
      deletedAt: Date(),
    });
    const deletedProduct = await service.delete('pid1', 'mid1');

    expect(deletedProduct).toEqual(true);
  });

  it('Should throw NotFoundException for unknown product on product delete', async () => {
    mockPrismaService.deletedAtFilter.product.findUnique.mockResolvedValue(
      null,
    );

    await expect(service.delete('pid1', 'mid1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw ForbiddenException for unauthorized operation on product delete', async () => {
    mockPrismaService.deletedAtFilter.product.findUnique.mockResolvedValue(
      fakeManagerProduct,
    );

    await expect(service.delete('pid1', 'mid2')).rejects.toThrow(
      ForbiddenException,
    );
  });

  //Product toggleLike

  it('Should toggle the like status of a product for a user to true', async () => {
    mockPrismaService.deletedAtFilter.product.findUnique.mockResolvedValue(
      fakeManagerProduct,
    );
    mockPrismaService.user.findUnique.mockResolvedValue({ userId: 'cid1' });
    mockPrismaService.userLike.upsert.mockResolvedValue({ isActive: true });

    const likeStatus = await service.toggleLike('pid1', 'uid1', true);

    expect(likeStatus).toEqual(true);
  });

  it('Should toggle the like status of a product for a user to false', async () => {
    mockPrismaService.deletedAtFilter.product.findUnique.mockResolvedValue(
      fakeManagerProduct,
    );
    mockPrismaService.user.findUnique.mockResolvedValue({ userId: 'cid1' });
    mockPrismaService.userLike.upsert.mockResolvedValue({ isActive: false });

    const likeStatus = await service.toggleLike('pid1', 'uid1', false);

    expect(likeStatus).toEqual(false);
  });

  it('Should throw NotFoundException for unknown product on product delete', async () => {
    mockPrismaService.deletedAtFilter.product.findUnique.mockResolvedValue(
      null,
    );

    await expect(service.toggleLike('pid1', 'uid1', false)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw NotFoundException for unknown user on product delete', async () => {
    mockPrismaService.deletedAtFilter.product.findUnique.mockResolvedValue(
      fakeManagerProduct,
    );
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(service.toggleLike('pid1', 'uid1', false)).rejects.toThrow(
      NotFoundException,
    );
  });
});
