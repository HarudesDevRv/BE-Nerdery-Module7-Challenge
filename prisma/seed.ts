import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const saltRounds = 10;

const connectionString = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
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
  const hashedPassword = await bcrypt.hash('abcd1234', saltRounds);

  // --- Users (client, manager, delivery_person) with Addresses ---
  const client1 = await prisma.user.upsert({
    where: { email: 'test_client@mail.com' },
    update: {},
    create: {
      email: 'test_client@mail.com',
      firstName: 'John',
      lastName: 'Doe',
      password: hashedPassword,
      role: 'client',
      address: {
        create: {
          address: 'Fake street 123',
          city: 'Arequipa',
          country: 'Peru',
          postalCode: '04001',
        },
      },
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'test_client2@mail.com' },
    update: {},
    create: {
      email: 'test_client2@mail.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: hashedPassword,
      role: 'client',
      address: {
        create: {
          address: 'Elm street 456',
          city: 'Lima',
          country: 'Peru',
          postalCode: '15001',
        },
      },
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'test_manager@mail.com' },
    update: {},
    create: {
      email: 'test_manager@mail.com',
      firstName: 'Alice',
      lastName: 'Manager',
      password: hashedPassword,
      role: 'manager',
      address: {
        create: {
          address: 'Admin avenue 789',
          city: 'Arequipa',
          country: 'Peru',
        },
      },
    },
  });

  await prisma.refreshToken.create({
    data: {
      userId: manager.userId,
      refreshToken: jwt.sign(
        {
          sub: manager.userId,
          email: manager.email,
          role: manager.role,
        },
        jwtSecret || 'secret',
        { expiresIn: '60d' },
      ),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  //deliveryPerson
  await prisma.user.upsert({
    where: { email: 'test_delivery@mail.com' },
    update: {},
    create: {
      email: 'test_delivery@mail.com',
      firstName: 'Bob',
      lastName: 'Delivery',
      password: hashedPassword,
      role: 'delivery_person',
      address: {
        create: {
          address: 'Courier road 321',
          city: 'Cusco',
          country: 'Peru',
        },
      },
    },
  });

  // --- Categories ---
  const categoryElectronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      imageUrl: 'https://placehold.co/400x300?text=Electronics',
      isActive: true,
    },
  });

  const categoryClothing = await prisma.category.upsert({
    where: { name: 'Clothing' },
    update: {},
    create: {
      name: 'Clothing',
      description: 'Apparel and fashion items',
      imageUrl: 'https://placehold.co/400x300?text=Clothing',
      isActive: true,
    },
  });

  //categoryBooks
  await prisma.category.upsert({
    where: { name: 'Books' },
    update: {},
    create: {
      name: 'Books',
      description: 'Physical and digital books',
      imageUrl: 'https://placehold.co/400x300?text=Books',
      isActive: false,
    },
  });

  // --- Brands ---
  const brandApple = await prisma.brand.upsert({
    where: { name: 'Apple' },
    update: {},
    create: {
      name: 'Apple',
      description: 'Technology company known for premium devices',
      imageUrl: 'https://placehold.co/200x200?text=Apple',
      isActive: true,
    },
  });

  const brandNike = await prisma.brand.upsert({
    where: { name: 'Nike' },
    update: {},
    create: {
      name: 'Nike',
      description: 'Athletic footwear and apparel',
      imageUrl: 'https://placehold.co/200x200?text=Nike',
      isActive: true,
    },
  });

  const brandSamsung = await prisma.brand.upsert({
    where: { name: 'Samsung' },
    update: {},
    create: {
      name: 'Samsung',
      description: 'Global electronics manufacturer',
      imageUrl: 'https://placehold.co/200x200?text=Samsung',
      isActive: true,
    },
  });

  // --- Store (managed by the manager user) ---
  const store = await prisma.store.upsert({
    where: { name: 'Main Store' },
    update: {},
    create: {
      name: 'Main Store',
      manager: { connect: { userId: manager.userId } },
      address: {
        create: {
          address: 'Commerce blvd 100',
          city: 'Arequipa',
          country: 'Peru',
          postalCode: '04002',
        },
      },
    },
  });

  // --- Products ---
  const productIphone = await prisma.product.upsert({
    where: { name_managerId: { name: 'iPhone 15', managerId: manager.userId } },
    update: {},
    create: {
      managerId: manager.userId,
      name: 'iPhone 15',
      description: 'Latest Apple smartphone with A17 chip',
      categoryId: categoryElectronics.categoryId,
      brandId: brandApple.brandId,
      isActive: true,
    },
  });

  const productGalaxy = await prisma.product.upsert({
    where: {
      name_managerId: { name: 'Galaxy S24', managerId: manager.userId },
    },
    update: {},
    create: {
      managerId: manager.userId,
      name: 'Galaxy S24',
      description: 'Samsung flagship smartphone with AI features',
      categoryId: categoryElectronics.categoryId,
      brandId: brandSamsung.brandId,
      isActive: true,
    },
  });

  const productAirMax = await prisma.product.upsert({
    where: {
      name_managerId: { name: 'Air Max 90', managerId: manager.userId },
    },
    update: {},
    create: {
      managerId: manager.userId,
      name: 'Air Max 90',
      description: 'Classic Nike running shoes',
      categoryId: categoryClothing.categoryId,
      brandId: brandNike.brandId,
      isActive: true,
    },
  });

  //productInactive
  await prisma.product.upsert({
    where: {
      name_managerId: {
        name: 'Discontinued Headphones',
        managerId: manager.userId,
      },
    },
    update: {},
    create: {
      managerId: manager.userId,
      name: 'Discontinued Headphones',
      description: 'No longer available product',
      categoryId: categoryElectronics.categoryId,
      brandId: brandSamsung.brandId,
      isActive: false,
      deletedAt: new Date(),
    },
  });

  // --- Images ---
  await prisma.image.upsert({
    where: { url: 'https://placehold.co/600x400?text=iPhone+15' },
    update: {},
    create: {
      productId: productIphone.productId,
      url: 'https://placehold.co/600x400?text=iPhone+15',
    },
  });

  await prisma.image.upsert({
    where: { url: 'https://placehold.co/600x400?text=iPhone+15+Back' },
    update: {},
    create: {
      productId: productIphone.productId,
      url: 'https://placehold.co/600x400?text=iPhone+15+Back',
    },
  });

  await prisma.image.upsert({
    where: { url: 'https://placehold.co/600x400?text=Galaxy+S24' },
    update: {},
    create: {
      productId: productGalaxy.productId,
      url: 'https://placehold.co/600x400?text=Galaxy+S24',
    },
  });

  await prisma.image.upsert({
    where: { url: 'https://placehold.co/600x400?text=Air+Max+90' },
    update: {},
    create: {
      productId: productAirMax.productId,
      url: 'https://placehold.co/600x400?text=Air+Max+90',
    },
  });

  // --- Inventory (products in store with prices and stock) ---
  const inventoryIphone = await prisma.inventory.upsert({
    where: {
      storeId_productId: {
        storeId: store.storeId,
        productId: productIphone.productId,
      },
    },
    update: {},
    create: {
      storeId: store.storeId,
      productId: productIphone.productId,
      price: 999.99,
      salePrice: 949.99,
      stock: 50,
      isActive: true,
    },
  });

  const inventoryGalaxy = await prisma.inventory.upsert({
    where: { inventoryId: 'seed-inv-galaxy' },
    update: {},
    create: {
      inventoryId: 'seed-inv-galaxy',
      storeId: store.storeId,
      productId: productGalaxy.productId,
      price: 849.99,
      salePrice: 799.99,
      stock: 30,
      isActive: true,
    },
  });

  const inventoryAirMax = await prisma.inventory.upsert({
    where: { inventoryId: 'seed-inv-airmax' },
    update: {},
    create: {
      inventoryId: 'seed-inv-airmax',
      storeId: store.storeId,
      productId: productAirMax.productId,
      price: 130.0,
      salePrice: 110.0,
      stock: 100,
      isActive: true,
    },
  });

  // --- UserLikes ---
  await prisma.userLike.upsert({
    where: {
      productId_userId: {
        productId: productIphone.productId,
        userId: client1.userId,
      },
    },
    update: {},
    create: {
      productId: productIphone.productId,
      userId: client1.userId,
      isActive: true,
    },
  });

  await prisma.userLike.upsert({
    where: {
      productId_userId: {
        productId: productAirMax.productId,
        userId: client1.userId,
      },
    },
    update: {},
    create: {
      productId: productAirMax.productId,
      userId: client1.userId,
      isActive: true,
    },
  });

  await prisma.userLike.upsert({
    where: {
      productId_userId: {
        productId: productGalaxy.productId,
        userId: client2.userId,
      },
    },
    update: {},
    create: {
      productId: productGalaxy.productId,
      userId: client2.userId,
      isActive: true,
    },
  });

  // --- Cart + CartItems (for client1) ---
  const cart = await prisma.cart.upsert({
    where: { userId: client1.userId },
    update: {},
    create: {
      userId: client1.userId,
    },
  });

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.cartId,
        productId: inventoryIphone.inventoryId,
      },
    },
    update: {},
    create: {
      cartId: cart.cartId,
      productId: inventoryIphone.inventoryId,
      amount: 1,
    },
  });

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.cartId,
        productId: inventoryAirMax.inventoryId,
      },
    },
    update: {},
    create: {
      cartId: cart.cartId,
      productId: inventoryAirMax.inventoryId,
      amount: 2,
    },
  });

  // --- Payment + Order + OrderProducts (for client2) ---
  const payment = await prisma.payment.create({
    data: {
      amount: 849.99,
      currency: 'USD',
      paymentMethod: 'credit_card',
      status: 'completed',
    },
  });

  const order = await prisma.order.create({
    data: {
      userId: client2.userId,
      paymentId: payment.paymentId,
    },
  });

  await prisma.orderProduct.upsert({
    where: {
      orderId_inventoryId: {
        orderId: order.orderId,
        inventoryId: inventoryGalaxy.inventoryId,
      },
    },
    update: {},
    create: {
      orderId: order.orderId,
      inventoryId: inventoryGalaxy.inventoryId,
      amount: 1,
      price: 799.99,
    },
  });
}

seed()
  .then(() => {
    console.log('Seeder initiated successfully');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
