import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';

describe('PrismaService', () => {
  let service: PrismaService;

  let connectSpy: jest.SpyInstance;
  let disconnectSpy: jest.SpyInstance;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest
        .fn()
        .mockReturnValue(
          'postgresql://user:pass@localhost:5432/db?schema=test',
        ),
    } as unknown as ConfigService;

    service = new PrismaService(configService);

    // Prevent real DB connections
    connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();
    disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect on module init', async () => {
    await service.onModuleInit();
    expect(connectSpy).toHaveBeenCalled();
  });

  it('should disconnect on module destroy', async () => {
    await service.onModuleDestroy();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});
