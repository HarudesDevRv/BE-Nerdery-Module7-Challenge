import { Injectable } from '@nestjs/common';
import { Image } from '@prisma/client';
import DataLoader from 'dataloader';
import { PrismaService } from 'src/common/services/prisma/prisma.service';

@Injectable()
export class ProductImageLoader {
  constructor(private prisma: PrismaService) {}

  createLoader() {
    return new DataLoader<string, Image[]>(
      async (productIds: readonly string[]) => {
        const images = await this.prisma.image.findMany({
          where: { productId: { in: [...productIds] } },
        });

        const grouped = productIds.map((id) =>
          images.filter((image) => image.productId === id),
        );

        return grouped;
      },
    );
  }
}
