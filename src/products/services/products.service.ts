import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { CreateProductInput } from '../dto/create-product.input';
import { UpdateProductInput } from '../dto/update-product.input';
import { ProductFilterInput } from '../dto/product-filter.input';
import { Category, Prisma } from '@prisma/client';
import { ManagerProductPaginationInput } from '../dto/manager-product-pagination.input';
import { ProductImage } from '../models/product.model';
import { ProductMapperService } from './product-mapper.service';
import {
  ProductsPage,
  ProductWithDetails,
} from '../models/product-detail.model';
import { ManagerProduct } from '../models/manager-product.model';

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
    select: { price: true, stock: true, salePrice: true, inventoryId: true },
    take: 1,
    orderBy: [{ price: 'asc' }, { stock: 'desc' }],
  },
  _count: {
    select: { userLikes: true },
  },
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(
    private prisma: PrismaService,
    private productUtility: ProductMapperService,
  ) {}

  async findAll(filter: ProductFilterInput): Promise<ProductsPage> {
    this.logger.log('Fetching all products');
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
        return this.productUtility.formatDetailedProduct(product);
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

  async findOne(productId: string): Promise<Partial<ProductWithDetails>> {
    this.logger.log(`Fetching product: ${productId}`);
    const product = await this.prisma.deletedAtFilter.product.findUnique({
      where: { productId, inventories: { some: {} } },
      select: productDetailSelect,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.productUtility.formatDetailedProduct(product);
  }

  async getByManagerId(
    managerId: string,
    pagination: ManagerProductPaginationInput,
  ) {
    this.logger.log(`Fetching products for managerId: ${managerId}`);
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

  async getCategories(): Promise<Partial<Category>[]> {
    this.logger.log('Fetching categories');
    const categories = await this.prisma.category.findMany({
      select: { name: true, description: true, imageUrl: true },
    });

    return categories;
  }

  async create(
    input: CreateProductInput,
    managerId: string,
  ): Promise<Partial<ManagerProduct>> {
    this.logger.log(`Creating product "${input.name}" for managerId: ${managerId}`);
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
  ): Promise<Partial<ManagerProduct>> {
    this.logger.log(`Updating product: ${productId} by managerId: ${managerId}`);
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
    this.logger.log(`Soft-deleting product: ${productId} by managerId: ${managerId}`);
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

  async toggleLike(
    productId: string,
    userId: string,
    isActive: boolean,
  ): Promise<boolean> {
    this.logger.log(`Toggling like on product: ${productId} by userId: ${userId} — isActive: ${isActive}`);
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
    this.logger.log(`Creating image for product: ${productId}`);
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
    this.logger.log(`Updating image URL for imageId: ${imageId}`);
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
    this.logger.log(`Soft-deleting imageId: ${imageId}`);
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
