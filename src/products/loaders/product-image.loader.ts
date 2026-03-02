import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { ProductImage } from '../models/product.model';

@Injectable()
export class ProductImageLoader {
  constructor(private prisma: PrismaService) {}

  createLoader() {
    return new DataLoader<string, ProductImage[]>(
      async (productIds: readonly string[]) => {
        const images = await this.prisma.image.findMany({
          where: { productId: { in: [...productIds] } },
        });

        const grouped = productIds.map((id) =>
          images
            .filter((image) => image.productId === id)
            .map((image) => ({
              imageId: image.imageId,
              url: image.url ?? undefined,
            })),
        );

        return grouped;
      },
    );
  }
}
