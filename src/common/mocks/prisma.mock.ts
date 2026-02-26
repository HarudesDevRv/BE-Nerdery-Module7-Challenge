import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

export type MockPrismaService = DeepMockProxy<PrismaClient> & {
  deletedAtFilter: DeepMockProxy<PrismaClient>;
};

export const createMockPrismaService = (): MockPrismaService => {
  const mock = mockDeep<PrismaClient>() as MockPrismaService;
  mock.deletedAtFilter = mockDeep<PrismaClient>();
  return mock;
};
