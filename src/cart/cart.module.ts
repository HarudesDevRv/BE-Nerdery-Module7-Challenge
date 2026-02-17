import { Module } from '@nestjs/common';
import { CartResolver } from './cart.resolver';
import { CartService } from './services/cart.service';
import { CartUtilsService } from './services/cart-utils.service';

@Module({
  providers: [CartResolver, CartService, CartUtilsService],
  exports: [CartService, CartUtilsService],
})
export class CartModule {}
