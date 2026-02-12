import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductFilterInput } from './dto/product-filter.input';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

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
      //where: categoryId ? { categoryId } : undefined,
      select: {
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
      },
      //take: filter.limit || 10,
      //skip: filter.page ? filter.page * (filter.limit || 10) : undefined,
    });

    console.log(products);

    return products;
  }

  async findOne(productId: string) {
    // TODO: implement find product by id
    return this.prisma.product.findUnique({ where: { productId } });
  }

  async getCategories() {
    return this.prisma.category.findMany({
      select: { name: true, description: true, imageUrl: true },
    });
  }

  async create(input: CreateProductInput, managerId: string) {
    console.log(input);
    console.log(managerId);
    return await this.prisma.product.create({
      data: {
        manager: { connect: { userId: managerId } },
        name: input.name,
        description: input.description,
        category: { connect: { categoryId: input.categoryId } },
        brand: { connect: { brandId: input.brandId } },
      },
    });

    // TODO: implement product creation
  }

  async update(productId: string, input: UpdateProductInput) {
    // TODO: implement product update
    return this.prisma.product.update({
      where: { productId },
      data: {
        ...input,
      },
    });
  }

  async delete(productId: string) {
    // TODO: implement soft delete
    return this.prisma.product.delete({ where: { productId } });
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
  async deleteImage(imageId: string) {
    //TODO: Implement image upload
    return this.prisma.image.delete({
      where: {
        imageId,
      },
    });
  }
}
