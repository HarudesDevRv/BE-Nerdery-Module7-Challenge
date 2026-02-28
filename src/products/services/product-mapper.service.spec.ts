import { Test, TestingModule } from '@nestjs/testing';
import { ProductMapperService } from './product-mapper.service';
import { Decimal } from '@prisma/client/runtime/client';
import { Image } from '@prisma/client';

const makeProduct = (overrides = {}) => ({
  productId: 'p1',
  name: 'Widget',
  description: 'A widget',
  category: { name: 'Gadgets' },
  brand: { name: 'Acme' },
  inventories: [
    {
      inventoryId: 'inv1',
      price: Decimal(9.99),
      salePrice: Decimal(7.99),
      stock: 5,
    },
  ],
  _count: { userLikes: 3 },
  ...overrides,
});

describe('ProductMapperService', () => {
  let service: ProductMapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductMapperService],
    }).compile();

    service = module.get<ProductMapperService>(ProductMapperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('formatDetailedProduct', () => {
    it('should map a product with all fields correctly', () => {
      const result = service.formatDetailedProduct(makeProduct());

      expect(result).toEqual({
        productId: 'p1',
        name: 'Widget',
        description: 'A widget',
        category: 'Gadgets',
        brand: 'Acme',
        inventoryId: 'inv1',
        price: 9.99,
        salePrice: 7.99,
        stock: 5,
        likesCount: 3,
      });
    });

    it('should convert Decimal price and salePrice to numbers', () => {
      const result = service.formatDetailedProduct(
        makeProduct({
          inventories: [
            {
              inventoryId: 'inv1',
              price: Decimal(19.99),
              salePrice: Decimal(14.5),
              stock: 10,
            },
          ],
        }),
      );

      expect(typeof result.price).toBe('number');
      expect(typeof result.salePrice).toBe('number');
      expect(result.price).toBe(19.99);
      expect(result.salePrice).toBe(14.5);
    });

    it('should return undefined inventory fields when product has no inventories', () => {
      const result = service.formatDetailedProduct(
        makeProduct({ inventories: [] }),
      );

      expect(result.inventoryId).toBeUndefined();
      expect(result.price).toBeUndefined();
      expect(result.salePrice).toBeUndefined();
      expect(result.stock).toBeUndefined();
    });

    it('should extract category and brand names from nested objects', () => {
      const result = service.formatDetailedProduct(
        makeProduct({
          category: { name: 'Electronics' },
          brand: { name: 'TechCorp' },
        }),
      );

      expect(result.category).toBe('Electronics');
      expect(result.brand).toBe('TechCorp');
    });

    it('should map likesCount from _count.userLikes', () => {
      const result = service.formatDetailedProduct(
        makeProduct({ _count: { userLikes: 0 } }),
      );

      expect(result.likesCount).toBe(0);
    });
  });

  describe('formatProductImage', () => {
    it('should return the image with url preserved', () => {
      const fakeImage = {
        imageId: 'img1',
        productId: 'pid1',
        url: 'http://example.com/photo.jpg',
        deletedAt: null,
      };

      const result = service.formatProductImage(fakeImage as Image);

      expect(result).toEqual({
        imageId: 'img1',
        productId: 'pid1',
        url: 'http://example.com/photo.jpg',
        deletedAt: null,
      });
    });

    it('should map null url to undefined', () => {
      const fakeImage = {
        imageId: 'img1',
        productId: 'pid1',
        url: null,
        deletedAt: null,
      };

      const result = service.formatProductImage(fakeImage as Image);

      expect(result.url).toBeUndefined();
    });
  });
});
