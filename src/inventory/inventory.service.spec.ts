import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { createMockPrismaService } from 'src/common/mocks/prisma.mock';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Inventory, Product, Store } from '@prisma/client';
import { CreateInventoryInput } from './dto/create-inventory.input';

const fakeStore: Partial<Store> = {
  storeId: 'sid1',
  name: 'Main Store',
};

const fakeProduct: Partial<Product> = {
  productId: 'pid1',
  managerId: 'mid1',
  name: 'Widget',
};

const fakeProductOtherManager: Partial<Product> = {
  productId: 'pid1',
  managerId: 'mid2',
  name: 'Widget',
};

const fakeRawInventory = {
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

const fakeInventoryWithOtherManager = {
  ...fakeRawInventory,
  product: fakeProductOtherManager,
};

const createInventoryInput: CreateInventoryInput = {
  productId: 'pid1',
  storeId: 'sid1',
  price: 10.0,
  salePrice: 8.99,
  stock: 50,
  isActive: true,
};

describe('InventoryService', () => {
  let service: InventoryService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStores', () => {
    it('should return the list of active stores', async () => {
      mockPrisma.store.findMany.mockResolvedValue([fakeStore as Store]);

      const result = await service.getStores();

      expect(result).toEqual([fakeStore]);
    });
  });

  describe('addInventory', () => {
    it('should add inventory for a product', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(
        fakeProduct as Product,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(null);
      mockPrisma.inventory.upsert.mockResolvedValue(
        fakeRawInventory as unknown as Inventory,
      );

      const result = await service.addInventory(createInventoryInput, 'mid1');

      expect(result.inventoryId).toBe('invid1');
      expect(result.price).toBe(10.0);
      expect(result.salePrice).toBe(8.99);
      expect(result.stock).toBe(50);
    });

    it('should throw NotFoundException when product is not found', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(null);

      await expect(
        service.addInventory(createInventoryInput, 'mid1'),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException when manager doesn't own the product", async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(
        fakeProduct as Product,
      );

      await expect(
        service.addInventory(createInventoryInput, 'mid2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when inventory already exists for that product/store', async () => {
      mockPrisma.deletedAtFilter.product.findUnique.mockResolvedValue(
        fakeProduct as Product,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fakeRawInventory as unknown as Inventory,
      );

      await expect(
        service.addInventory(createInventoryInput, 'mid1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateInventory', () => {
    it('should update and return the inventory with numeric prices', async () => {
      const updatedInventory = { ...fakeRawInventory, stock: 100 };
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fakeRawInventory as unknown as Inventory,
      );
      mockPrisma.inventory.update.mockResolvedValue(
        updatedInventory as unknown as Inventory,
      );

      const result = await service.updateInventory(
        'invid1',
        { stock: 100 },
        'mid1',
      );

      expect(result.stock).toBe(100);
      expect(result.price).toBe(10.0);
    });

    it('should throw NotFoundException when inventory is not found', async () => {
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(null);

      await expect(
        service.updateInventory('invid1', { stock: 100 }, 'mid1'),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException when manager doesn't own the product", async () => {
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fakeInventoryWithOtherManager as unknown as Inventory,
      );

      await expect(
        service.updateInventory('invid1', { stock: 100 }, 'mid1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeInventory', () => {
    it('should soft-delete an inventory and return true', async () => {
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fakeRawInventory as unknown as Inventory,
      );
      mockPrisma.inventory.update.mockResolvedValue({} as Inventory);

      const result = await service.removeInventory('invid1', 'mid1');

      expect(result).toBe(true);
    });

    it('should throw NotFoundException when inventory is not found', async () => {
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(null);

      await expect(service.removeInventory('invid1', 'mid1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ForbiddenException when manager doesn't own the product", async () => {
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fakeInventoryWithOtherManager as unknown as Inventory,
      );

      await expect(service.removeInventory('invid1', 'mid1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
