import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
const saltRounds = 10;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Database URL not found');
}

const schema = new URL(connectionString).searchParams.get('schema') ?? 'public';
const adapter = new PrismaPg(
  {
    connectionString,
    options: `-c search_path=${schema}`,
  },
  {
    schema,
  },
);

const prisma = new PrismaClient({ adapter });
async function seed() {
  await prisma.user.upsert({
    include: { address: {} },
    where: {
      email: 'test_client@mail.com',
    },
    update: {},
    create: {
      email: 'test_client@mail.com',
      firstName: 'Tester',
      lastName: 'Testing',
      password: await bcrypt.hash('abc123', saltRounds),
      address: {
        create: {
          address: 'Fake street 123',
          city: 'Arequipa',
          country: 'Peru',
        },
      },
    },
  });
  await prisma.user.upsert({
    include: { address: {} },
    where: {
      email: 'test_client2@mail.com',
    },
    update: {},
    create: {
      email: 'test_client2@mail.com',
      firstName: 'Tester',
      lastName: 'Testing',
      password: await bcrypt.hash('abc123', saltRounds),
      address: {
        create: {},
      },
    },
  });
  await prisma.user.upsert({
    include: { address: {} },
    where: {
      email: 'test_manager@mail.com',
    },
    update: {},
    create: {
      email: 'test_manager@mail.com',
      firstName: 'Tester',
      lastName: 'Testing',
      password: await bcrypt.hash('abc123', saltRounds),
      address: {
        create: {},
      },
    },
  });
}

seed()
  .then(() => {
    console.log('Seeder executed successfully');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
