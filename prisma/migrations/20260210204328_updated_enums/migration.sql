/*
  Warnings:

  - The values [Client,Manager] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `address` on the `addresses` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `city` on the `addresses` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `country` on the `addresses` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `postal_code` on the `addresses` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `description` on the `brands` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `image_url` on the `brands` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.
  - You are about to alter the column `description` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `image_url` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.
  - You are about to alter the column `url` on the `images` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.
  - The primary key for the `password_resets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `reset_token` on the `password_resets` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(500)`.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `currency` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `payment_method` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `status` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(30)`.
  - You are about to alter the column `description` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(1000)`.
  - The primary key for the `refresh_tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `refresh_token` on the `refresh_tokens` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(500)`.
  - You are about to alter the column `name` on the `stores` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `password` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(72)`.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'processing', 'cancelled', 'shipped', 'delivered');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('client', 'manager', 'delivery_person');
ALTER TABLE "nest_ecommerce"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "nest_ecommerce"."Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'client';
COMMIT;

-- AlterTable
ALTER TABLE "addresses" ALTER COLUMN "address" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "city" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "country" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "postal_code" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "brands" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "image_url" SET DATA TYPE VARCHAR(2048);

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "image_url" SET DATA TYPE VARCHAR(2048);

-- AlterTable
ALTER TABLE "images" ALTER COLUMN "url" SET DATA TYPE VARCHAR(2048);

-- AlterTable
ALTER TABLE "password_resets" DROP CONSTRAINT "password_resets_pkey",
ALTER COLUMN "reset_token" SET DATA TYPE VARCHAR(500),
ADD CONSTRAINT "password_resets_pkey" PRIMARY KEY ("reset_token");

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3),
ALTER COLUMN "payment_method" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "status" SET DATA TYPE VARCHAR(30);

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(1000);

-- AlterTable
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_pkey",
ALTER COLUMN "refresh_token" SET DATA TYPE VARCHAR(500),
ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("refresh_token");

-- AlterTable
ALTER TABLE "stores" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "role" SET DEFAULT 'client',
ALTER COLUMN "first_name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "last_name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(72);
