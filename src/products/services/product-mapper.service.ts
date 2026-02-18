import { Injectable } from '@nestjs/common';
import { Image, Inventory, Product } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

type ManagerProduct = Product & {
  inventories: Inventory[];
  images: Image[];
};

type ProductDetailInventory = {
  price: Decimal;
  salePrice: Decimal;
  stock: number;
};

type ProductDetailImage = {
  imageId: string;
  url: string;
};

type DetailedProduct = {
  productId: string;
  name: string;
  description: string;
  category: { name: string };
  brand: { name: string };
  images: ProductDetailImage[];
  inventories: ProductDetailInventory[];
  _count: { userLikes: number };
};

@Injectable()
export class ProductMapperService {
  formatManagerProduct(product: ManagerProduct) {
    return {
      ...product,
      inventories: product.inventories.map((inventory) => ({
        ...inventory,
        price: inventory.price.toNumber(),
        salePrice: inventory.salePrice.toNumber(),
      })),
    };
  }

  formatDetailedProduct(product: DetailedProduct) {
    const inventory = product.inventories[0];
    return {
      productId: product.productId,
      name: product.name,
      description: product.description,
      category: product.category.name,
      brand: product.brand.name,
      price: inventory?.price.toNumber(),
      salePrice: inventory?.salePrice.toNumber(),
      stock: inventory?.stock,
      images: product.images,
      likesCount: product._count.userLikes,
    };
  }
}
