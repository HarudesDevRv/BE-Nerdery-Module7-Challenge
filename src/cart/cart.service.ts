import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartInput } from './dto/add-to-cart.input';
import { UpdateCartItemInput } from './dto/update-cart-item.input';
import { Cart } from './models/cart.model';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string): Promise<Cart> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        products: { include: { product: { include: { product: true } } } },
      },
    });

    if (!cart) {
      throw new InternalServerErrorException(
        'There was a problem retrieving the user cart, please contact support',
      );
    }

    const formattedCart = {
      cartId: cart.cartId,
      total: cart.products.reduce(
        (accumulator, item) =>
          accumulator + item.amount * item.product.salePrice.toNumber(),
        0,
      ),
      items: cart.products.map((product) => ({
        productId: product.productId,
        productName: product.product.product.name,
        amount: product.amount,
        unitPrice: product.product.salePrice.toNumber(),
        subtotal: product.amount * product.product.salePrice.toNumber(),
      })),
    };

    return formattedCart;
  }

  async addItem(userId: string, input: AddToCartInput) {
    // TODO: add item to cart
  }

  async updateItem(userId: string, input: UpdateCartItemInput) {
    // TODO: update cart item amount, remove if 0
  }

  async removeItem(userId: string, inventoryId: string) {
    // TODO: remove item from cart
  }

  async clearCart(userId: string) {
    // TODO: remove all items from cart
  }
}
