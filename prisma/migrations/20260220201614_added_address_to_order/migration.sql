-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "address_id" TEXT;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("address_id") ON DELETE SET NULL ON UPDATE CASCADE;
