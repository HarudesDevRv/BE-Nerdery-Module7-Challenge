-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed');

-- CreateTable
CREATE TABLE "discount_codes" (
    "discount_code_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "expiration_date" TIMESTAMP(3) NOT NULL,
    "usage_limit" INTEGER NOT NULL,
    "min_amount" INTEGER,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("discount_code_id")
);

-- CreateTable
CREATE TABLE "order_discount_codes" (
    "order_id" TEXT NOT NULL,
    "discount_code_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_discount_codes_pkey" PRIMARY KEY ("order_id","discount_code_id")
);

-- AddForeignKey
ALTER TABLE "order_discount_codes" ADD CONSTRAINT "order_discount_codes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_discount_codes" ADD CONSTRAINT "order_discount_codes_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("discount_code_id") ON DELETE RESTRICT ON UPDATE CASCADE;
