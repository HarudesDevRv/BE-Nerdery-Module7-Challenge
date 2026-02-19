-- AlterTable
ALTER TABLE "discount_codes" ADD COLUMN     "stripe_coupon_id" TEXT,
ADD COLUMN     "stripe_promotion_code_id" TEXT;
