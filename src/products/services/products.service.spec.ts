/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductMapperService } from './product-mapper.service';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as fixtures from './products.service.fixtures';
import { createMockPrismaService } from 'src/common/mocks/prisma.mock';
import {
  Brand,
  Category,
  Image,
  Product,
  User,
  UserLike,
} from '@prisma/client';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let productMapper: ProductMapperService;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        ProductMapperService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    productMapper = module.get<ProductMapperService>(ProductMapperService);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCategories', () => {
    it('should retrieve the category list', async () => {
      mockPrisma.category.findMany.mockResolvedValue([
        { name: 'Gadgets' },
      ] as Category[]);

      const categories = await service.getCategories();

      expect(categories).toEqual([
        {
          name: 'Gadgets',
        },
      ]);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      mockPrisma.$transaction.mockResolvedValue([[fixtures.fakeProduct], 1]);

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

    it('should format each product', async () => {
      mockPrisma.$transaction.mockResolvedValue([[fixtures.fakeProduct], 1]);

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

    it('should throw NotFoundException for unknown category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.findAll({ category: 'Unknown' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should filter products by minPrice', async () => {
      mockPrisma.$transaction.mockResolvedValue([[fixtures.fakeProduct], 1]);

      await service.findAll({ minPrice: 5 });

      expect(mockPrisma.deletedAtFilter.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            categoryId: undefined,
            inventories: { some: { salePrice: { gte: 5, lte: undefined } } },
          },
        }),
      );
    });

    it('should filter products by maxPrice', async () => {
      mockPrisma.$transaction.mockResolvedValue([[fixtures.fakeProduct], 1]);

      await service.findAll({ maxPrice: 15 });

      expect(mockPrisma.deletedAtFilter.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            categoryId: undefined,
            inventories: { some: { salePrice: { gte: undefined, lte: 15 } } },
          },
        }),
      );
    });

    it('should filter products by minPrice and maxPrice range', async () => {
      mockPrisma.$transaction.mockResolvedValue([[fixtures.fakeProduct], 1]);

      await service.findAll({ minPrice: 5, maxPrice: 15 });

      expect(mockPrisma.deletedAtFilter.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            categoryId: undefined,
            inventories: { some: { salePrice: { gte: 5, lte: 15 } } },
          },
        }),
      );
    });

    it('should exclude products whose inventories do not match the price filter', async () => {
      const productOutsideRange = { ...fixtures.fakeProduct, inventories: [] };
      mockPrisma.$transaction.mockResolvedValue([[productOutsideRange], 0]);

      const result = await service.findAll({ minPrice: 100 });

      expect(result.items).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a formatted product', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(
        fixtures.fakeProduct as unknown as Product,
      );

      const formatDetailedProductSpy = jest.spyOn(
        productMapper,
        'formatDetailedProduct',
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

      expect(formatDetailedProductSpy).toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown product', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('pid1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getByManagerId', () => {
    it('should return paginated manager products', async () => {
      mockPrisma.$transaction.mockResolvedValue([
        [fixtures.fakeManagerProduct],
        1,
      ]);

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
  });

  describe('create', () => {
    it('should create a product', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        categoryId: 'cid2',
      } as Category);
      mockPrisma.brand.findUnique.mockResolvedValue({
        brandId: 'bid2',
      } as Brand);

      mockPrisma.product.create.mockResolvedValue(
        fixtures.fakeCreatedManagerProduct as unknown as Product,
      );

      const product = await service.create(fixtures.productCreateInput, 'mid1');

      expect(product).toEqual({
        managerId: 'mid1',
        productId: 'pid1',
        name: 'Widget 2',
        description: 'A widget 2',
        brandId: 'bid2',
        categoryId: 'cid2',
        isActive: true,
        images: [],
        inventories: [],
      });
    });

    it('should throw NotFoundException for unknown category on product create', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.brand.findUnique.mockResolvedValue({
        brandId: 'bid2',
      } as Brand);

      await expect(
        service.create(fixtures.productCreateInput, 'mid1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for unknown brand on product create', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({
        categoryId: 'cid2',
      } as Category);

      await expect(
        service.create(fixtures.productCreateInput, 'mid1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        categoryId: 'cid2',
      } as Category);
      mockPrisma.brand.findUnique.mockResolvedValue({
        brandId: 'bid2',
      } as Brand);

      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(
        fixtures.fakeManagerProduct as unknown as Product,
      );

      mockPrisma.deletedAtFilter.product.update.mockResolvedValue(
        fixtures.fakeUpdatedManagerProduct as unknown as Product,
      );

      const updatedProduct = await service.update(
        'pid1',
        fixtures.updateInput,
        'mid1',
      );

      expect(updatedProduct).toEqual({
        managerId: 'mid1',
        productId: 'pid1',
        name: 'Widget 2',
        description: 'A widget 2',
        brandId: 'bid2',
        categoryId: 'cid2',
        isActive: false,
      });
    });

    it('should throw NotFoundException for unknown product on product update', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(null);

      await expect(service.update('pid2', {}, 'mid1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for unknown category on product update', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('pid2', { categoryId: 'cid1' }, 'mid1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for unknown brand on product update', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.update('pid2', { brandId: 'bid1' }, 'mid1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized operation on product update', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(
        fixtures.fakeManagerProduct as unknown as Product,
      );

      await expect(service.update('pid1', {}, 'mid2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('delete', () => {
    it('should soft delete a product', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue({
        ...fixtures.fakeManagerProduct,
        deletedAt: new Date(),
      } as unknown as Product);
      const deletedProduct = await service.delete('pid1', 'mid1');

      expect(deletedProduct).toEqual(true);
    });

    it('should throw NotFoundException for unknown product on product delete', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(null);

      await expect(service.delete('pid1', 'mid1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for unauthorized operation on product delete', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(
        fixtures.fakeManagerProduct as unknown as Product,
      );

      await expect(service.delete('pid1', 'mid2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('toggleLike', () => {
    it('should toggle the like status of a product for a user to true', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(
        fixtures.fakeManagerProduct as unknown as Product,
      );
      mockPrisma.user.findUnique.mockResolvedValue({ userId: 'cid1' } as User);
      mockPrisma.userLike.upsert.mockResolvedValue({
        isActive: true,
      } as UserLike);

      const likeStatus = await service.toggleLike('pid1', 'uid1', true);

      expect(likeStatus).toEqual(true);
    });

    it('should toggle the like status of a product for a user to false', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(
        fixtures.fakeManagerProduct as unknown as Product,
      );
      mockPrisma.user.findUnique.mockResolvedValue({ userId: 'cid1' } as User);
      mockPrisma.userLike.upsert.mockResolvedValue({
        isActive: false,
      } as UserLike);

      const likeStatus = await service.toggleLike('pid1', 'uid1', false);

      expect(likeStatus).toEqual(false);
    });

    it('should throw NotFoundException for unknown product on toggleLike', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(null);

      await expect(service.toggleLike('pid1', 'uid1', false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for unknown user on toggleLike', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(
        fixtures.fakeManagerProduct as unknown as Product,
      );
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.toggleLike('pid1', 'uid1', false)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createImage', () => {
    it('should create an image', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(
        fixtures.fakeManagerProduct as unknown as Product,
      );
      mockPrisma.image.create.mockResolvedValue(fixtures.fakeImage as Image);

      const image = await service.createImage(
        'pid1',
        'mid1',
        'http://example.com/image.jpg',
      );

      expect(image).toEqual({
        imageId: 'iid1',
        productId: 'pid1',
        url: 'http://example.com/image.jpg',
        deletedAt: null,
      });
    });

    it('should throw NotFoundException for unknown product on image create', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(null);

      await expect(service.createImage('pid1', 'mid1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for unauthorized operation on image create', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(
        fixtures.fakeManagerProduct as unknown as Product,
      );

      await expect(service.createImage('pid1', 'mid2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateImageUrl', () => {
    it('should update an image URL', async () => {
      const updatedImage = {
        ...fixtures.fakeImage,
        url: 'http://example.com/new-image.jpg',
      };
      mockPrisma.deletedAtFilter.image.findUnique.mockResolvedValue(
        fixtures.fakeImageWithProduct as unknown as Image,
      );
      mockPrisma.image.update.mockResolvedValue(updatedImage as Image);

      const image = await service.updateImageUrl(
        'iid1',
        'http://example.com/new-image.jpg',
        'mid1',
      );

      expect(image).toEqual({
        imageId: 'iid1',
        productId: 'pid1',
        url: 'http://example.com/new-image.jpg',
        deletedAt: null,
      });
    });

    it('should throw NotFoundException for unknown image on image update', async () => {
      mockPrisma.deletedAtFilter.image.findUnique.mockResolvedValue(null);

      await expect(
        service.updateImageUrl(
          'iid1',
          'http://example.com/new-image.jpg',
          'mid1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized operation on image update', async () => {
      mockPrisma.deletedAtFilter.image.findUnique.mockResolvedValue(
        fixtures.fakeImageWithProduct as unknown as Image,
      );

      await expect(
        service.updateImageUrl(
          'iid1',
          'http://example.com/new-image.jpg',
          'mid2',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteImage', () => {
    it('should soft delete an image', async () => {
      const deletedAt = new Date();
      const deletedImage = { ...fixtures.fakeImage, deletedAt };
      mockPrisma.deletedAtFilter.image.findUnique.mockResolvedValue(
        fixtures.fakeImageWithProduct as unknown as Image,
      );
      mockPrisma.image.update.mockResolvedValue(deletedImage as Image);

      const image = await service.deleteImage('iid1', 'mid1');

      expect(image).toEqual({
        imageId: 'iid1',
        productId: 'pid1',
        url: 'http://example.com/image.jpg',
        deletedAt,
      });
    });

    it('should throw NotFoundException for unknown image on image delete', async () => {
      mockPrisma.deletedAtFilter.image.findUnique.mockResolvedValue(null);

      await expect(service.deleteImage('iid1', 'mid1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for unauthorized operation on image delete', async () => {
      mockPrisma.deletedAtFilter.image.findUnique.mockResolvedValue(
        fixtures.fakeImageWithProduct as unknown as Image,
      );

      await expect(service.deleteImage('iid1', 'mid2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
