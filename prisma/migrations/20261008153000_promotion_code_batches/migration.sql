CREATE TABLE "PromotionCodeBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "shopifyDiscountId" TEXT,
    "configurationJson" TEXT NOT NULL,
    "codesJson" TEXT NOT NULL,
    "confirmedJson" TEXT NOT NULL DEFAULT '[]',
    "pendingJson" TEXT NOT NULL DEFAULT '[]',
    "activeJobId" TEXT,
    "reconciliationCursor" TEXT,
    "reconciliationJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "error" TEXT,
    "leaseToken" TEXT,
    "leaseUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "PromotionCodeBatch_shop_requestKey_key" ON "PromotionCodeBatch"("shop", "requestKey");
CREATE INDEX "PromotionCodeBatch_shop_shopifyDiscountId_idx" ON "PromotionCodeBatch"("shop", "shopifyDiscountId");
