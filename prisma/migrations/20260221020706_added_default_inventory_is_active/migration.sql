-- AlterTable
ALTER TABLE "inventories" ALTER COLUMN "is_active" DROP NOT NULL,
ALTER COLUMN "is_active" SET DEFAULT true;
