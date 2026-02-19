import { Injectable } from '@nestjs/common';
import { Inventory } from '@prisma/client';
import DataLoader from 'dataloader';
import { PrismaService } from 'src/common/services/prisma/prisma.service';

@Injectable()
export class ProductInventoryLoader {
  constructor(private prisma: PrismaService) {}

  createLoader() {
    return new DataLoader<string, Inventory[]>(
      async (productIds: readonly string[]) => {
        const inventories = await this.prisma.inventory.findMany({
          where: { productId: { in: [...productIds] } },
        });

        const grouped = productIds.map((id) =>
          inventories.filter((inventory) => inventory.productId === id),
        );

        return grouped;
      },
    );
  }
}
