import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DiscountCode } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { StripeService } from '../../common/services/stripe/stripe.service';
import { CreatePromoCodeInput } from '../dto/create-promo-code.input';
import { UpdatePromoCodeInput } from '../dto/update-promo-code.input';
import { PromoCode } from '../models/promo-code.model';
import { PromoCodeMapperService } from './promo-code-mapper.service';

@Injectable()
export class PromoCodeService {
  private readonly logger = new Logger(PromoCodeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly mapper: PromoCodeMapperService,
  ) {}

  async create(input: CreatePromoCodeInput): Promise<PromoCode> {
    if (input.expirationDate <= new Date()) {
      throw new BadRequestException('Expiration date must be in the future');
    }

    const existing = await this.prisma.discountCode.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw new ConflictException(`Promo code "${input.code}" already exists`);
    }

    const { stripeCouponId, stripePromotionCodeId } =
      await this.stripe.createPromoCode({
        code: input.code,
        discountType: input.discountType,
        discountValue: input.discountValue,
        expirationDate: input.expirationDate,
        usageLimit: input.usageLimit,
        minAmount: input.minAmount,
      });

    try {
      const newCode = await this.prisma.discountCode.create({
        data: {
          code: input.code,
          discountType: input.discountType,
          discountValue: input.discountValue,
          expirationDate: input.expirationDate,
          usageLimit: input.usageLimit,
          minAmount: input.minAmount,
          stripeCouponId,
          stripePromotionCodeId,
        },
      });
      return this.mapper.formatPromoCode(newCode);
    } catch (dbError) {
      this.logger.error(
        'DB write failed after Stripe promo code creation; attempting rollback',
        dbError,
      );
      try {
        await this.stripe.deleteCoupon(stripeCouponId);
      } catch (rollbackError) {
        this.logger.error(
          `CRITICAL: Stripe coupon orphaned. stripeCouponId=${stripeCouponId}`,
          rollbackError,
        );
      }
      throw new InternalServerErrorException('Failed to persist promo code');
    }
  }

  async update(id: string, input: UpdatePromoCodeInput): Promise<PromoCode> {
    const record = await this.findOrThrow(id);

    const hasFields = Object.values(input).some((v) => v !== undefined);
    if (!hasFields) {
      throw new BadRequestException('At least one field must be provided');
    }

    if (
      record.stripePromotionCodeId &&
      (input.isActive !== undefined || input.minAmount !== undefined)
    ) {
      await this.stripe.updatePromoCode(record.stripePromotionCodeId, {
        isActive: input.isActive,
        minAmount: input.minAmount,
      });
    }

    const updatedCode = await this.prisma.discountCode.update({
      where: { discountCodeId: id },
      data: {
        ...(input.expirationDate !== undefined && {
          expirationDate: input.expirationDate,
        }),
        ...(input.usageLimit !== undefined && { usageLimit: input.usageLimit }),
        ...(input.minAmount !== undefined && { minAmount: input.minAmount }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    return this.mapper.formatPromoCode(updatedCode);
  }

  async disable(id: string): Promise<PromoCode> {
    const record = await this.findOrThrow(id);

    if (!record.isActive) {
      throw new BadRequestException('Promo code is already disabled');
    }

    if (record.stripePromotionCodeId) {
      await this.stripe.disablePromoCode(record.stripePromotionCodeId);
    }

    const updatedCode = await this.prisma.discountCode.update({
      where: { discountCodeId: id },
      data: { isActive: false },
    });

    return this.mapper.formatPromoCode(updatedCode);
  }

  private async findOrThrow(id: string): Promise<DiscountCode> {
    const record = await this.prisma.discountCode.findUnique({
      where: { discountCodeId: id },
    });
    if (!record) {
      throw new NotFoundException(`Promo code with id "${id}" not found`);
    }
    return record;
  }
}
