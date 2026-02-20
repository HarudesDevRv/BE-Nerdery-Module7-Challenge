import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'path';
import { PrismaModule } from './common/services/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CaslModule } from './common/casl/casl.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { S3Module } from './common/services/s3/s3.module';
import { StripeModule } from './common/services/stripe/stripe.module';
import { PaymentModule } from './payment/payment.module';
import { PromoCodeModule } from './promo-code/promo-code.module';
import { ProductImageLoader } from './products/loaders/product-image.loader';
import { ProductInventoryLoader } from './products/loaders/product-inventory.loader';
import { OrderItemsLoader } from './orders/loaders/order-items.loader';
import { OrderPromoCodesLoader } from './orders/loaders/order-promo-codes.loader';
import { DeliveryModule } from './delivery/delivery.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow<string>('REDIS_HOST'),
          port: config.getOrThrow<number>('REDIS_PORT'),
        },
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      imports: [ProductsModule, OrdersModule],
      inject: [
        ProductImageLoader,
        ProductInventoryLoader,
        OrderItemsLoader,
        OrderPromoCodesLoader,
      ],
      driver: ApolloDriver,
      useFactory: (
        imageLoader: ProductImageLoader,
        inventoryLoader: ProductInventoryLoader,
        orderItemLoader: OrderItemsLoader,
        orderPromoCodeLoader: OrderPromoCodesLoader,
      ) => ({
        driver: ApolloDriver,
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        context: () => ({
          imagesLoader: imageLoader.createLoader(),
          inventoriesLoader: inventoryLoader.createLoader(),
          orderItemsLoader: orderItemLoader.createLoader(),
          orderPromoCodesLoader: orderPromoCodeLoader.createLoader(),
        }),
      }),
    }),
    PrismaModule,
    CaslModule,
    AuthModule,
    ProductsModule,
    S3Module,
    CartModule,
    OrdersModule,
    StripeModule,
    PaymentModule,
    PromoCodeModule,
    DeliveryModule,
  ],
})
export class AppModule {}
