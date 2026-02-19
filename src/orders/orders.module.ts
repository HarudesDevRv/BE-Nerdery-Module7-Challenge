import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';
import { OrderUtilsService } from './order-utils.service';
import { OrderItemsLoader } from './loaders/order-items.loader';
import { OrderPromoCodesLoader } from './loaders/order-promo-codes.loader';

@Module({
  imports: [CartModule],
  providers: [
    OrdersResolver,
    OrdersService,
    OrderUtilsService,
    OrderItemsLoader,
    OrderPromoCodesLoader,
  ],
  exports: [OrdersService, OrderItemsLoader, OrderPromoCodesLoader],
})
export class OrdersModule {}
