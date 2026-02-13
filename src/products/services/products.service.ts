import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductInput } from '../dto/create-product.input';
import { UpdateProductInput } from '../dto/update-product.input';
import { ProductFilterInput } from '../dto/product-filter.input';
import { ProductUtilityService } from './product-utility.service';
import { Prisma } from '@prisma/client';

const productDetailSelect = {
  productId: true,
  category: { select: { name: true } },
  brand: { select: { name: true } },
  name: true,
  description: true,
  images: { select: { imageId: true, url: true } },
  inventories: {
    select: { price: true, stock: true, salePrice: true },
    take: 1,
    orderBy: { price: 'asc' },
  },
  _count: {
    select: { userLikes: true },
  },
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private productUtility: ProductUtilityService,
  ) {}

  async findAll(filter: ProductFilterInput) {
    const categoryId = filter.category
      ? (
          await this.prisma.category.findUnique({
            where: { name: filter.category },
            select: { categoryId: true },
          })
        )?.categoryId
      : undefined;

    if (filter.category && categoryId === undefined) {
      throw new NotFoundException('Category not found');
    }

    const products = await this.prisma.product.findMany({
      where: { categoryId },
      select: productDetailSelect,
      take: filter.limit || 10,
      skip: filter.page ? (filter.page - 1) * (filter.limit || 10) : undefined,
    });

    const formattedProducts = products.map((product) =>
      this.productUtility.formatDetailedProduct(product),
    );

    return formattedProducts;
  }

  async findOne(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { productId },
      select: productDetailSelect,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.productUtility.formatDetailedProduct(product);
  }

  async getByManagerId(managerId: string, filter: ProductFilterInput) {
    const categoryId = filter.category
      ? (
          await this.prisma.category.findUnique({
            where: { name: filter.category },
            select: { categoryId: true },
          })
        )?.categoryId
      : undefined;

    if (filter.category && categoryId === undefined) {
      throw new NotFoundException('Category not found');
    }

    const products = await this.prisma.product.findMany({
      where: { categoryId },
      include: {
        images: true,
        inventories: true,
      },
      take: filter.limit || 10,
      skip: filter.page ? (filter.page - 1) * (filter.limit || 10) : undefined,
    });

    const formattedProducts = products.map((product) =>
      this.productUtility.formatManagerProduct(product),
    );

    return formattedProducts;
  }

  async getCategories() {
    return this.prisma.category.findMany({
      select: { name: true, description: true, imageUrl: true },
    });
  }

  async create(input: CreateProductInput, managerId: string) {
    const newProduct = await this.prisma.product.create({
      data: {
        manager: { connect: { userId: managerId } },
        name: input.name,
        description: input.description,
        category: { connect: { categoryId: input.categoryId } },
        brand: { connect: { brandId: input.brandId } },
      },
    });
    return { ...newProduct, images: [], inventories: [] };
  }

  async update(
    productId: string,
    input: UpdateProductInput,
    managerId: string,
  ) {
    // TODO: implement product update
    const product = await this.prisma.product.findUnique({
      where: { productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.managerId !== managerId) {
      throw new ForbiddenException("Can't access this product");
    }

    const updatedProduct = await this.prisma.product.update({
      where: { productId },
      include: {
        images: true,
        inventories: true,
      },
      data: {
        ...input,
      },
    });

    const formattedProduct = {
      ...updatedProduct,
      inventories: updatedProduct.inventories.map((inventory) => ({
        ...inventory,
        price: inventory.price.toNumber(),
        salePrice: inventory.salePrice.toNumber(),
      })),
    };

    return formattedProduct;
  }

  async delete(productId: string): Promise<boolean> {
    // TODO: implement soft delete
    return (
      (await this.prisma.product.delete({ where: { productId } })) !== null
    );
  }

  async toggleLike(productId: string, userId: string, isActive: boolean) {
    // TODO: implement like/unlike toggle
    return this.prisma.userLike.upsert({
      where: { productId_userId: { productId, userId } },
      create: {
        productId,
        userId,
        isActive,
      },
      update: {
        isActive,
      },
    });
  }

  async createImage(productId: string, url: string) {
    //TODO: Implement image upload
    return this.prisma.image.create({
      data: {
        productId,
        url,
      },
    });
  }
  async deleteImage(imageId: string): Promise<boolean> {
    //TODO: Implement image upload
    return (
      (await this.prisma.image.update({
        where: {
          imageId,
        },
        data: {
          deletedAt: Date(),
        },
      })) !== null
    );
  }
}
