import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { AddToCartInput } from '../dto/add-to-cart.input';
import { UpdateCartItemInput } from '../dto/update-cart-item.input';
import { Cart } from '../models/cart.model';
import { Prisma } from '@prisma/client';
import { CartMapperService } from './cart-mapper.service';

const cartInventoryInclude = {
  cart: {
    include: {
      products: {
        include: { inventory: { include: { product: true } } },
      },
    },
  },
} satisfies Prisma.CartItemInclude;

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private cartUtils: CartMapperService,
  ) {}

  private async getUserCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new InternalServerErrorException(
        'There was a problem retrieving the user cart, please contact support',
      );
    }
    return cart;
  }

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

    return this.cartUtils.formatCart(cart);
  }

  async addItem(userId: string, input: AddToCartInput) {
    const cart = await this.getUserCart(userId);

    const inventory = await this.prisma.deletedAtFilter.inventory.findUnique({
      where: { inventoryId: input.inventoryId },
    });

    if (!inventory || !inventory.isActive) {
      throw new NotFoundException('Inventory item not found');
    }

    if (inventory.stock < input.amount) {
      throw new BadRequestException(
        `Insufficient stock: requested ${input.amount}, available ${inventory.stock}`,
      );
    }

    const newCart = await this.prisma.cartItem.create({
      data: {
        cartId: cart.cartId,
        inventoryId: input.inventoryId,
        amount: input.amount,
      },
      include: cartInventoryInclude,
    });

    return this.cartUtils.formatCart(newCart.cart);
  }

  async updateItem(userId: string, input: UpdateCartItemInput) {
    const cart = await this.getUserCart(userId);

    const inventory = await this.prisma.deletedAtFilter.inventory.findUnique({
      where: { inventoryId: input.inventoryId },
    });

    if (!inventory || !inventory.isActive) {
      throw new NotFoundException('Inventory item not found');
    }

    if (inventory.stock < input.amount) {
      throw new BadRequestException(
        `Insufficient stock: requested ${input.amount}, available ${inventory.stock}`,
      );
    }

    const newCart = await this.prisma.cartItem.update({
      where: {
        cartId_inventoryId: {
          cartId: cart.cartId,
          inventoryId: input.inventoryId,
        },
      },
      data: {
        amount: input.amount,
      },
      include: cartInventoryInclude,
    });

    return this.cartUtils.formatCart(newCart.cart);
  }

  async removeItem(userId: string, inventoryId: string) {
    const cart = await this.getUserCart(userId);

    const newCart = await this.prisma.cartItem.delete({
      where: { cartId_inventoryId: { cartId: cart.cartId, inventoryId } },
      include: cartInventoryInclude,
    });

    newCart.cart.products = newCart.cart.products.filter(
      (product) => product.inventoryId != inventoryId,
    );

    return this.cartUtils.formatCart(newCart.cart);
  }

  async clearCart(userId: string) {
    const cart = await this.getUserCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: {
        cartId: cart.cartId,
      },
    });

    return true;
  }
}
