import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { GuestOrdersResolver } from './resolvers/guest-orders.resolver';
import { OrdersResolver } from './resolvers/orders.resolver';
import { OrdersService } from './orders.service';
import { OrderUtilsService } from './order-utils.service';
import { OrderItemsLoader } from './loaders/order-items.loader';
import { OrderPromoCodesLoader } from './loaders/order-promo-codes.loader';

@Module({
  imports: [CartModule],
  providers: [
    GuestOrdersResolver,
    OrdersResolver,
    OrdersService,
    OrderUtilsService,
    OrderItemsLoader,
    OrderPromoCodesLoader,
  ],
  exports: [OrdersService, OrderItemsLoader, OrderPromoCodesLoader],
})
export class OrdersModule {}
