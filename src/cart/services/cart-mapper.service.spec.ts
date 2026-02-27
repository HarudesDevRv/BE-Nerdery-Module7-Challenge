import { Test, TestingModule } from '@nestjs/testing';
import { CartMapperService } from './cart-mapper.service';
import { Decimal } from '@prisma/client/runtime/client';

describe('CartMapperService', () => {
  let service: CartMapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartMapperService],
    }).compile();

    service = module.get<CartMapperService>(CartMapperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should format a cart with items', () => {
    const rawCart = {
      cartId: 'cartid1',
      products: [
        {
          amount: 2,
          inventory: {
            salePrice: Decimal(29.99),
            product: {
              productId: 'pid1',
              name: 'Awesome Product',
            },
          },
        },
      ],
    };

    const result = service.formatCart(rawCart);

    expect(result).toEqual({
      cartId: 'cartid1',
      total: 59.98,
      items: [
        {
          productId: 'pid1',
          productName: 'Awesome Product',
          amount: 2,
          unitPrice: 29.99,
          subtotal: 59.98,
        },
      ],
    });
  });

  it('should format an empty cart', () => {
    const rawCart = {
      cartId: 'cartid1',
      products: [],
    };

    const result = service.formatCart(rawCart);

    expect(result).toEqual({
      cartId: 'cartid1',
      total: 0,
      items: [],
    });
  });

  it('should calculate total correctly for multiple items', () => {
    const rawCart = {
      cartId: 'cartid1',
      products: [
        {
          amount: 2,
          inventory: {
            salePrice: Decimal(10.0),
            product: { productId: 'pid1', name: 'Product A' },
          },
        },
        {
          amount: 3,
          inventory: {
            salePrice: Decimal(5.0),
            product: { productId: 'pid2', name: 'Product B' },
          },
        },
      ],
    };

    const result = service.formatCart(rawCart);

    expect(result.total).toBe(35);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].subtotal).toBe(20);
    expect(result.items[1].subtotal).toBe(15);
  });
});
