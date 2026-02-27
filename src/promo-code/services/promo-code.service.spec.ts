/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PromoCodeService } from './promo-code.service';
import { PromoCodeMapperService } from './promo-code-mapper.service';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { createMockPrismaService } from 'src/common/mocks/prisma.mock';
import { StripeService } from '../../common/services/stripe/stripe.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DiscountCode } from '@prisma/client';
import * as fixtures from './promo-code.service.fixtures';

describe('PromoCodeService', () => {
  let service: PromoCodeService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockStripe: ReturnType<typeof fixtures.createMockStripeService>;
  let mockMapper: ReturnType<typeof fixtures.createMockPromoCodeMapper>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockStripe = fixtures.createMockStripeService();
    mockMapper = fixtures.createMockPromoCodeMapper();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromoCodeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StripeService, useValue: mockStripe },
        { provide: PromoCodeMapperService, useValue: mockMapper },
      ],
    }).compile();

    service = module.get<PromoCodeService>(PromoCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a promo code in Stripe and persist it', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(null);
      mockPrisma.discountCode.create.mockResolvedValue(
        fixtures.fakeDiscountCode as DiscountCode,
      );

      const result = await service.create(fixtures.createInput);

      expect(mockStripe.createPromoCode).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'SAVE10' }),
      );
      expect(mockPrisma.discountCode.create).toHaveBeenCalled();
      expect(result.discountValue).toBe(10.0);
    });

    it('should throw BadRequestException when expiration date is in the past', async () => {
      await expect(
        service.create({
          ...fixtures.createInput,
          expirationDate: new Date('2020-01-01'),
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockStripe.createPromoCode).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when code already exists', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        fixtures.fakeDiscountCode as DiscountCode,
      );

      await expect(service.create(fixtures.createInput)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the formatted promo code', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        fixtures.fakeDiscountCode as DiscountCode,
      );
      mockPrisma.discountCode.update.mockResolvedValue(
        fixtures.fakeDiscountCode as DiscountCode,
      );

      const result = await service.update('dc1', { usageLimit: 200 });

      expect(mockPrisma.discountCode.update).toHaveBeenCalled();
      expect(result.discountValue).toBe(10.0);
    });

    it('should call stripe.updatePromoCode when isActive field is provided and stripe code exists', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        fixtures.fakeDiscountCode as DiscountCode,
      );
      mockPrisma.discountCode.update.mockResolvedValue(
        fixtures.fakeDiscountCode as DiscountCode,
      );

      await service.update('dc1', { isActive: false });

      expect(mockStripe.updatePromoCode).toHaveBeenCalledWith(
        'promo_456',
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should not call stripe.updatePromoCode when no relevant fields are changed', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        fixtures.fakeDiscountCode as DiscountCode,
      );
      mockPrisma.discountCode.update.mockResolvedValue(
        fixtures.fakeDiscountCode as DiscountCode,
      );

      await service.update('dc1', { usageLimit: 200 });

      expect(mockStripe.updatePromoCode).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when no fields are provided', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        fixtures.fakeDiscountCode as DiscountCode,
      );

      await expect(service.update('dc1', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when promo code is not found', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(null);

      await expect(service.update('dc1', { usageLimit: 10 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('disable', () => {
    it('should disable the promo code and call stripe.disablePromoCode', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        fixtures.fakeDiscountCode as DiscountCode,
      );
      mockPrisma.discountCode.update.mockResolvedValue({
        ...fixtures.fakeDiscountCode,
        isActive: false,
      } as DiscountCode);

      await service.disable('dc1');

      expect(mockStripe.disablePromoCode).toHaveBeenCalledWith('promo_456');
      expect(mockPrisma.discountCode.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
    });

    it('should disable a promo code without a Stripe promotion code', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        fixtures.fakeDiscountCodeNoStripe as DiscountCode,
      );
      mockPrisma.discountCode.update.mockResolvedValue({
        ...fixtures.fakeDiscountCodeNoStripe,
        isActive: false,
      } as DiscountCode);

      await service.disable('dc1');

      expect(mockStripe.disablePromoCode).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when promo code is already disabled', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        fixtures.fakeDiscountCodeDisabled as DiscountCode,
      );

      await expect(service.disable('dc1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when promo code is not found', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(null);

      await expect(service.disable('dc1')).rejects.toThrow(NotFoundException);
    });
  });
});
