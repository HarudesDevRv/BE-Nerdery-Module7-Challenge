import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { PrismaModule } from './common/services/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CaslModule } from './common/casl/casl.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { S3Module } from './common/services/s3/s3.module';
import { StripeModule } from './common/services/stripe/stripe.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    }),
    PrismaModule,
    CaslModule,
    AuthModule,
    ProductsModule,
    S3Module,
    CartModule,
    OrdersModule,
    StripeModule,
  ],
})
export class AppModule {}
