import { Injectable } from '@nestjs/common';
import { Cart } from '../models/cart.model';

interface CartProduct {
  amount: number;
  inventory: {
    salePrice: { toNumber: () => number };
    product: {
      productId: string;
      name: string;
    };
  };
}

interface RawCart {
  cartId: string;
  products: CartProduct[];
}

@Injectable()
export class CartMapperService {
  formatCart(cart: RawCart): Cart {
    return {
      cartId: cart.cartId,
      total: cart.products.reduce(
        (accumulator, item) =>
          accumulator + item.amount * item.inventory.salePrice.toNumber(),
        0,
      ),
      items: cart.products.map((product) => ({
        productId: product.inventory.product.productId,
        productName: product.inventory.product.name,
        amount: product.amount,
        unitPrice: product.inventory.salePrice.toNumber(),
        subtotal: product.amount * product.inventory.salePrice.toNumber(),
      })),
    };
  }
}
