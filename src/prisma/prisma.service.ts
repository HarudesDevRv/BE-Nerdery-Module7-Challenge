import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Please set DATABASE_URL on your .env file');
    }
    const schema =
      new URL(connectionString).searchParams.get('schema') ?? 'public';
    const adapter = new PrismaPg(
      {
        connectionString,
        options: `-c search_path=${schema}`,
      },
      {
        schema,
      },
    );
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
