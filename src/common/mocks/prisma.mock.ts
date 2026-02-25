export const createMockPrismaService = () => ({
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
  order: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  cart: {
    findUnique: jest.fn(),
  },
  inventory: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  userLike: {
    upsert: jest.fn(),
  },
  image: {
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
    inventory: {
      findUnique: jest.fn(),
    },
  },
});
