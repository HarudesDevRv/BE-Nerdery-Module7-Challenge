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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCart', () => {
    it('should retrieve and format the user cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeRawCart as unknown as Cart,
      );
      const formatCartSpy = jest.spyOn(cartMapper, 'formatCart');

      const cart = await service.getCart('uid1');

      expect(cart).toEqual(fixtures.fakeFormattedCart);
      expect(formatCartSpy).toHaveBeenCalled();
    });

    it('should retrieve and format an empty cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeRawCartEmpty as unknown as Cart,
      );

      const cart = await service.getCart('uid1');

      expect(cart).toEqual(fixtures.fakeFormattedEmptyCart);
    });

    it('should throw InternalServerErrorException when cart is not found', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      await expect(service.getCart('uid1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('addItem', () => {
    it('should add an item to the cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventory as Inventory,
      );
      mockPrisma.cartItem.create.mockResolvedValue(
        fixtures.fakeCartItemWithCart as CartItem,
      );

      const cart = await service.addItem('uid1', fixtures.addToCartInput);

      expect(cart).toEqual(fixtures.fakeFormattedCart);
    });

    it('should throw InternalServerErrorException when cart is not found on addItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem('uid1', fixtures.addToCartInput),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw NotFoundException when inventory is not found on addItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem('uid1', fixtures.addToCartInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when inventory is inactive on addItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventoryInactive as Inventory,
      );

      await expect(
        service.addItem('uid1', fixtures.addToCartInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when stock is insufficient on addItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventoryOutOfStock as Inventory,
      );

      await expect(
        service.addItem('uid1', fixtures.addToCartInput),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateItem', () => {
    it('should update an item in the cart', async () => {
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
        'uid1',
        fixtures.updateCartItemInput,
      );

      expect(cart).toEqual(fixtures.fakeFormattedCart);
    });

    it('should throw InternalServerErrorException when cart is not found on updateItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      await expect(
        service.updateItem('uid1', fixtures.updateCartItemInput),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw NotFoundException when inventory is not found on updateItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(null);

      await expect(
        service.updateItem('uid1', fixtures.updateCartItemInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when inventory is inactive on updateItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventoryInactive as Inventory,
      );

      await expect(
        service.updateItem('uid1', fixtures.updateCartItemInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when stock is insufficient on updateItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.deletedAtFilter.inventory.findUnique.mockResolvedValue(
        fixtures.fakeInventoryOutOfStock as Inventory,
      );

      await expect(
        service.updateItem('uid1', fixtures.updateCartItemInput),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.cartItem.delete.mockResolvedValue(
        fixtures.fakeCartItemWithCart as CartItem,
      );

      const cart = await service.removeItem('uid1', 'invid1');

      // The service filters out the deleted inventoryId, leaving an empty cart
      expect(cart.cartId).toEqual('cartid1');
      expect(cart.items).toHaveLength(0);
      expect(cart.total).toBe(0);
    });

    it('should throw InternalServerErrorException when cart is not found on removeItem', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      await expect(service.removeItem('uid1', 'invid1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('clearCart', () => {
    it('should clear all items from the cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        fixtures.fakeUserCart as Cart,
      );
      mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.clearCart('uid1');

      expect(result).toBe(true);
    });

    it('should throw InternalServerErrorException when cart is not found on clearCart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      await expect(service.clearCart('uid1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
