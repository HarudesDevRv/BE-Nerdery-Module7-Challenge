import { Injectable } from '@nestjs/common';
import { Product } from '@prisma/client';
import DataLoader from 'dataloader';
import { PrismaService } from 'src/common/services/prisma/prisma.service';

@Injectable()
export class ProductLoader {
  constructor(private prisma: PrismaService) {}

  createLoader() {
    return new DataLoader<string, Product[]>(
      async (managerIds: readonly string[]) => {
        const products = await this.prisma.product.findMany({
          where: { managerId: { in: [...managerIds] } },
        });

        const grouped = managerIds.map((id) =>
          products.filter((product) => product.managerId === id),
        );

        return grouped;
      },
    );
  }
}
