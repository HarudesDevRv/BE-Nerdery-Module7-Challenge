/*
  Warnings:

  - A unique constraint covering the columns `[name,manager_id]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `manager_id` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "manager_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "products_name_manager_id_key" ON "products"("name", "manager_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
