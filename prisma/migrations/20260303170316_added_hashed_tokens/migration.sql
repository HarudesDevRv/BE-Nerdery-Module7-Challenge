/*
  Warnings:

  - The primary key for the `refresh_tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `refresh_token` on the `refresh_tokens` table. All the data in the column will be lost.
  - Made the column `is_active` on table `inventories` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `token_hash` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - The required column `token_id` was added to the `refresh_tokens` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "inventories" ALTER COLUMN "is_active" SET NOT NULL;

-- AlterTable
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_pkey",
DROP COLUMN "refresh_token",
ADD COLUMN     "token_hash" VARCHAR(72) NOT NULL,
ADD COLUMN     "token_id" TEXT NOT NULL,
ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("token_id");
