import { Module } from '@nestjs/common';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';
import { OrderUtilsService } from './order-utils.service';

@Module({
  providers: [OrdersResolver, OrdersService, OrderUtilsService],
  exports: [OrdersService],
})
export class OrdersModule {}
