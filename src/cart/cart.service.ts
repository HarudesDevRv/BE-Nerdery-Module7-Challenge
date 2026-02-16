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
        products: { include: { inventory: { include: { product: true } } } },
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

    return formattedCart;
  }

  async addItem(userId: string, input: AddToCartInput) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new InternalServerErrorException(
        'There was a problem retrieving the user cart, please contact support',
      );
    }

    const newCart = await this.prisma.cartItem.create({
      data: {
        cartId: cart.cartId,
        inventoryId: input.inventoryId,
        amount: input.amount,
      },
      include: {
        cart: {
          include: {
            products: {
              include: { inventory: { include: { product: true } } },
            },
          },
        },
      },
    });

    const formattedCart = {
      cartId: cart.cartId,
      total: newCart.cart.products.reduce(
        (accumulator, item) =>
          accumulator + item.amount * item.inventory.salePrice.toNumber(),
        0,
      ),
      items: newCart.cart.products.map((product) => ({
        productId: product.inventory.product.productId,
        productName: product.inventory.product.name,
        amount: product.amount,
        unitPrice: product.inventory.salePrice.toNumber(),
        subtotal: product.amount * product.inventory.salePrice.toNumber(),
      })),
    };

    return formattedCart;
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
