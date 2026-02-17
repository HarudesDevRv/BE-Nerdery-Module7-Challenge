/*
  Warnings:

  - Added the required column `subtotal` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL;
