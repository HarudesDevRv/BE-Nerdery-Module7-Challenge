import { Test, TestingModule } from '@nestjs/testing';
import { ProductMapperService } from './product-mapper.service';
import { Decimal } from '@prisma/client/runtime/client';

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

  it('should map a product', () => {
    const fakeProduct = {
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
    };

    const formattedProduct = service.formatDetailedProduct(fakeProduct);

    expect(formattedProduct).toEqual({
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
});
