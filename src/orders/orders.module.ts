import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';
import { OrderUtilsService } from './order-utils.service';

@Module({
  imports: [CartModule],
  providers: [OrdersResolver, OrdersService, OrderUtilsService],
  exports: [OrdersService],
})
export class OrdersModule {}
