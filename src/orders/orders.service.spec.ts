import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { createMockPrismaService } from 'src/common/mocks/prisma.mock';
import { OrderUtilsService } from './order-utils.service';
import { CartService } from '../cart/services/cart.service';

const createMockCartService = () => ({
  clearCart: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockCartService: ReturnType<typeof createMockCartService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockCartService = createMockCartService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        OrderUtilsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CartService, useValue: mockCartService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });
});
