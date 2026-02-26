import { Module } from '@nestjs/common';
import { CartResolver } from './cart.resolver';
import { CartService } from './services/cart.service';
import { CartMapperService } from './services/cart-mapper.service';

@Module({
  providers: [CartResolver, CartService, CartMapperService],
  exports: [CartService, CartMapperService],
})
export class CartModule {}
