import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { createMockPrismaService } from 'src/common/mocks/prisma.mock';
import { CartMapperService } from './cart-mapper.service';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Cart, CartItem, Inventory } from '@prisma/client';
import * as fixtures from './cart.service.fixtures';

describe('CartService', () => {
  let service: CartService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let cartMapper: CartMapperService;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        CartMapperService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    cartMapper = module.get<CartMapperService>(CartMapperService);
    service = module.get<CartService>(CartService);
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCart', () => {
    it('Should retrieve and format the user cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeRawCart as unknown as Cart,
      );
      const formatCartSpy = jest.spyOn(cartMapper, 'formatCart');

      const cart = await service.getCart(fixtures.fakeUserId);

      expect(cart).toEqual(fixtures.fakeFormattedCart);
      expect(formatCartSpy).toHaveBeenCalled();
    });

    it('Should retrieve and format an empty cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeRawCartEmpty as unknown as Cart,
      );

      const cart = await service.getCart(fixtures.fakeUserId);

      expect(cart).toEqual(fixtures.fakeFormattedEmptyCart);
    });

    it('Should throw InternalServerErrorException when cart is not found', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      await expect(service.getCart(fixtures.fakeUserId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('addItem', () => {
    it('Should add an item to the cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventory as Inventory,
      );
      mockPrisma.cartItem.create.mockResolvedValue(
        fixtures.fakeCartItemWithCart as CartItem,
      );

      const cart = await service.addItem(
        fixtures.fakeUserId,
        fixtures.addToCartInput,
      );

      expect(cart).toEqual(fixtures.fakeFormattedCart);
    });

    it('Should throw InternalServerErrorException when cart is not found on addItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem(fixtures.fakeUserId, fixtures.addToCartInput),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('Should throw NotFoundException when inventory is not found on addItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem(fixtures.fakeUserId, fixtures.addToCartInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw NotFoundException when inventory is inactive on addItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventoryInactive as Inventory,
      );

      await expect(
        service.addItem(fixtures.fakeUserId, fixtures.addToCartInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw BadRequestException when stock is insufficient on addItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventoryOutOfStock as Inventory,
      );

      await expect(
        service.addItem(fixtures.fakeUserId, fixtures.addToCartInput),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateItem', () => {
    it('Should update an item in the cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventory as Inventory,
      );
      mockPrisma.cartItem.update.mockResolvedValue(
        fixtures.fakeCartItemWithCart as CartItem,
      );

      const cart = await service.updateItem(
        fixtures.fakeUserId,
        fixtures.updateCartItemInput,
      );

      expect(cart).toEqual(fixtures.fakeFormattedCart);
    });

    it('Should throw InternalServerErrorException when cart is not found on updateItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      await expect(
        service.updateItem(fixtures.fakeUserId, fixtures.updateCartItemInput),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('Should throw NotFoundException when inventory is not found on updateItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(null);

      await expect(
        service.updateItem(fixtures.fakeUserId, fixtures.updateCartItemInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw NotFoundException when inventory is inactive on updateItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventoryInactive as Inventory,
      );

      await expect(
        service.updateItem(fixtures.fakeUserId, fixtures.updateCartItemInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw BadRequestException when stock is insufficient on updateItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventoryOutOfStock as Inventory,
      );

      await expect(
        service.updateItem(fixtures.fakeUserId, fixtures.updateCartItemInput),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeItem', () => {
    it('Should remove an item from the cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.cartItem.delete.mockResolvedValue(
        fixtures.fakeCartItemWithCart as CartItem,
      );

      const cart = await service.removeItem(
        fixtures.fakeUserId,
        fixtures.fakeInventoryId,
      );

      // The service filters out the deleted inventoryId, leaving an empty cart
      expect(cart.cartId).toEqual(fixtures.fakeCartId);
      expect(cart.items).toHaveLength(0);
      expect(cart.total).toBe(0);
    });

    it('Should throw InternalServerErrorException when cart is not found on removeItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      await expect(
        service.removeItem(fixtures.fakeUserId, fixtures.fakeInventoryId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('clearCart', () => {
    it('Should clear all items from the cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.clearCart(fixtures.fakeUserId);

      expect(result).toBe(true);
    });

    it('Should throw InternalServerErrorException when cart is not found on clearCart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      await expect(service.clearCart(fixtures.fakeUserId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
