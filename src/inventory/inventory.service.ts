import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { CreateInventoryInput } from './dto/create-inventory.input';
import { UpdateInventoryInput } from './dto/update-inventory.input';
import { Inventory } from 'src/products/models/manager-product.model';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getStores() {
    return this.prisma.store.findMany({
      where: { deletedAt: null },
      select: { storeId: true, name: true },
    });
  }

  async addInventory(
    input: CreateInventoryInput,
    managerId: string,
  ): Promise<Inventory> {
    const product = await this.prisma.deletedAtFilter.product.findUnique({
      where: { productId: input.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.managerId !== managerId) {
      throw new ForbiddenException("Can't manage this product's inventory");
    }

    const exists = await this.prisma.deletedAtFilter.inventory.findUnique({
      where: {
        storeId_productId: {
          storeId: input.storeId,
          productId: input.productId,
        },
      },
    });

    if (exists) {
      throw new ConflictException(
        'Inventory already exists for that product on that store',
      );
    }

    const inventory = await this.prisma.inventory.upsert({
      where: {
        storeId_productId: {
          storeId: input.storeId,
          productId: input.productId,
        },
      },
      create: {
        product: { connect: { productId: input.productId } },
        store: { connect: { storeId: input.storeId } },
        price: input.price,
        salePrice: input.salePrice,
        stock: input.stock,
        isActive: input.isActive,
      },
      update: {
        product: { connect: { productId: input.productId } },
        store: { connect: { storeId: input.storeId } },
        price: input.price,
        salePrice: input.salePrice,
        stock: input.stock,
        isActive: input.isActive,
        deletedAt: null,
      },
    });

    return {
      ...inventory,
      price: Number(inventory.price),
      salePrice: Number(inventory.salePrice),
    };
  }

  async updateInventory(
    inventoryId: string,
    input: UpdateInventoryInput,
    managerId: string,
  ): Promise<Inventory> {
    const inventory = await this.prisma.deletedAtFilter.inventory.findUnique({
      where: { inventoryId },
      include: { product: true },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    if (inventory.product.managerId !== managerId) {
      throw new ForbiddenException("Can't manage this product's inventory");
    }

    const updated = await this.prisma.inventory.update({
      where: { inventoryId },
      data: { ...input },
    });

    return {
      ...updated,
      price: Number(updated.price),
      salePrice: Number(updated.salePrice),
    };
  }

  async removeInventory(
    inventoryId: string,
    managerId: string,
  ): Promise<boolean> {
    const inventory = await this.prisma.deletedAtFilter.inventory.findUnique({
      where: { inventoryId },
      include: { product: true },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    if (inventory.product.managerId !== managerId) {
      throw new ForbiddenException("Can't manage this product's inventory");
    }

    await this.prisma.inventory.update({
      where: { inventoryId },
      data: { deletedAt: new Date() },
    });

    return true;
  }
}
