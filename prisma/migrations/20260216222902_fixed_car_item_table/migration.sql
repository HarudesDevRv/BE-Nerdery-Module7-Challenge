/*
  Warnings:

  - The primary key for the `cart_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `product_id` on the `cart_items` table. All the data in the column will be lost.
  - Added the required column `inventory_id` to the `cart_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_product_id_fkey";

-- AlterTable
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_pkey",
DROP COLUMN "product_id",
ADD COLUMN     "inventory_id" TEXT NOT NULL,
ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("cart_id", "inventory_id");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventories"("inventoryId") ON DELETE RESTRICT ON UPDATE CASCADE;
