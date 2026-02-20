import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { CreateProductInput } from '../dto/create-product.input';
import { UpdateProductInput } from '../dto/update-product.input';
import { ProductFilterInput } from '../dto/product-filter.input';
import { Prisma } from '@prisma/client';
import { ManagerProductPaginationInput } from '../dto/manager-product-pagination.input';
import { ProductImage } from '../models/product.model';
import { ProductMapperService } from './product-mapper.service';

const productDetailSelect = {
  productId: true,
  category: { select: { name: true } },
  brand: { select: { name: true } },
  name: true,
  description: true,
  images: {
    select: { imageId: true, url: true },
    where: { deletedAt: null, url: { not: null } },
  },
  inventories: {
    select: { price: true, stock: true, salePrice: true },
    take: 1,
    orderBy: [{ price: 'asc' }, { stock: 'desc' }],
  },
  _count: {
    select: { userLikes: true },
  },
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private productUtility: ProductMapperService,
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

    const inventoryWhere =
      filter.minPrice != null || filter.maxPrice != null
        ? {
            salePrice: {
              gte: filter.minPrice ?? undefined,
              lte: filter.maxPrice ?? undefined,
            },
          }
        : {};

    const where = { categoryId, inventories: { some: inventoryWhere } };
    const limit = filter.limit || 10;
    const page = filter.page || 1;

    const [products, totalItems] = await this.prisma.$transaction([
      this.prisma.deletedAtFilter.product.findMany({
        where,
        select: {
          ...productDetailSelect,
          inventories: {
            ...productDetailSelect.inventories,
            where: inventoryWhere,
          },
        },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.deletedAtFilter.product.count({ where }),
    ]);

    const formattedProducts = products
      .filter((product) => product.inventories.length > 0)
      .map((product) => {
        const images = product.images.flatMap((img) =>
          img.url != null ? [{ imageId: img.imageId, url: img.url }] : [],
        );
        return this.productUtility.formatDetailedProduct({
          ...product,
          images,
        });
      });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: formattedProducts,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
      },
    };
  }

  async findOne(productId: string) {
    const product = await this.prisma.deletedAtFilter.product.findUnique({
      where: { productId, inventories: { some: {} } },
      select: productDetailSelect,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const images = product.images.flatMap((img) =>
      img.url != null ? [{ imageId: img.imageId, url: img.url }] : [],
    );
    return this.productUtility.formatDetailedProduct({ ...product, images });
  }

  async getByManagerId(
    managerId: string,
    pagination: ManagerProductPaginationInput,
  ) {
    const limit = pagination.limit || 10;
    const page = pagination.page || 1;

    const [products, totalItems] = await this.prisma.$transaction([
      this.prisma.deletedAtFilter.product.findMany({
        where: { managerId },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.deletedAtFilter.product.count({ where: { managerId } }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: products,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
      },
    };
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
    const product = await this.prisma.deletedAtFilter.product.findUnique({
      where: { productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.managerId !== managerId) {
      throw new ForbiddenException("Can't access this product");
    }

    const updatedProduct = await this.prisma.deletedAtFilter.product.update({
      where: { productId },
      data: {
        ...input,
      },
    });

    return updatedProduct;
  }

  async delete(productId: string, managerId: string): Promise<boolean> {
    const product = await this.prisma.deletedAtFilter.product.findUnique({
      where: { productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.managerId !== managerId) {
      throw new ForbiddenException("Can't access this product");
    }

    await this.prisma.product.update({
      where: { productId },
      data: { deletedAt: Date() },
    });

    return true;
  }

  async toggleLike(productId: string, userId: string, isActive: boolean) {
    const product = await this.prisma.deletedAtFilter.product.findUnique({
      where: { productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const likeStatus = await this.prisma.userLike.upsert({
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

    return likeStatus.isActive;
  }

  async createImage(
    productId: string,
    userId: string | null,
    url?: string,
  ): Promise<ProductImage> {
    const product = await this.prisma.deletedAtFilter.product.findUnique({
      where: { productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.managerId !== userId) {
      throw new ForbiddenException("Can't access this product");
    }

    const newImage = await this.prisma.image.create({
      data: {
        productId,
        url,
      },
    });

    return this.productUtility.formatProductImage(newImage);
  }

  async updateImageUrl(
    imageId: string,
    url: string,
    userId: string,
  ): Promise<ProductImage> {
    const image = await this.prisma.deletedAtFilter.image.findUnique({
      where: { imageId },
      include: { product: true },
    });

    if (!image) {
      throw new NotFoundException('Product not found');
    }

    if (image.product.managerId !== userId) {
      throw new ForbiddenException("Can't access this product");
    }

    const updatedImage = await this.prisma.image.update({
      where: { imageId },
      data: { url },
    });

    return this.productUtility.formatProductImage(updatedImage);
  }

  async deleteImage(imageId: string, userId: string): Promise<ProductImage> {
    const image = await this.prisma.deletedAtFilter.image.findUnique({
      where: { imageId },
      include: { product: true },
    });

    if (!image) {
      throw new NotFoundException('Product not found');
    }

    if (image.product.managerId !== userId) {
      throw new ForbiddenException("Can't access this product");
    }

    const deletedImage = await this.prisma.image.update({
      where: { imageId },
      data: { deletedAt: new Date() },
    });

    return this.productUtility.formatProductImage(deletedImage);
  }
}
