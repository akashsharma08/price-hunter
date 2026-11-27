-- CreateEnum
CREATE TYPE "IntegrationProviderKey" AS ENUM ('amazon_in_creators', 'flipkart_affiliate');

-- CreateEnum
CREATE TYPE "IntegrationFailureStage" AS ENUM ('auth', 'search', 'details', 'price', 'availability', 'match', 'normalize', 'validate', 'persist');

-- AlterTable
ALTER TABLE "RetailerListing" ADD COLUMN     "isStale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "providerKey" "IntegrationProviderKey",
ADD COLUMN     "rawPayload" JSONB;

-- CreateTable
CREATE TABLE "ProductMatch" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "providerKey" "IntegrationProviderKey" NOT NULL,
    "externalProductId" TEXT NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "matchedOn" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationFailure" (
    "id" TEXT NOT NULL,
    "providerKey" "IntegrationProviderKey" NOT NULL,
    "stage" "IntegrationFailureStage" NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationFailure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductMatch_providerKey_status_idx" ON "ProductMatch"("providerKey", "status");

-- CreateIndex
CREATE INDEX "ProductMatch_confidence_idx" ON "ProductMatch"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMatch_productVariantId_providerKey_externalProductId_key" ON "ProductMatch"("productVariantId", "providerKey", "externalProductId");

-- CreateIndex
CREATE INDEX "IntegrationFailure_providerKey_createdAt_idx" ON "IntegrationFailure"("providerKey", "createdAt");

-- CreateIndex
CREATE INDEX "IntegrationFailure_stage_idx" ON "IntegrationFailure"("stage");

-- CreateIndex
CREATE INDEX "RetailerListing_isStale_idx" ON "RetailerListing"("isStale");

-- CreateIndex
CREATE INDEX "RetailerListing_providerKey_idx" ON "RetailerListing"("providerKey");

-- AddForeignKey
ALTER TABLE "ProductMatch" ADD CONSTRAINT "ProductMatch_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
