-- CreateTable
CREATE TABLE "PromotionSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "shopifyDiscountId" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "websiteEnabled" BOOLEAN NOT NULL DEFAULT false,
    "showProductPage" BOOLEAN NOT NULL DEFAULT false,
    "showCollectionPage" BOOLEAN NOT NULL DEFAULT false,
    "showProductBadge" BOOLEAN NOT NULL DEFAULT false,
    "showCountdown" BOOLEAN NOT NULL DEFAULT false,
    "showHeaderBanner" BOOLEAN NOT NULL DEFAULT false,
    "headline" TEXT,
    "body" TEXT,
    "badgeText" TEXT,
    "countdownText" TEXT,
    "buttonText" TEXT,
    "buttonUrl" TEXT,
    "backgroundColour" TEXT,
    "textColour" TEXT,
    "badgeColour" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" DATETIME,
    "lastSyncError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "PromotionSettings_shop_idx" ON "PromotionSettings"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionSettings_shop_shopifyDiscountId_key" ON "PromotionSettings"("shop", "shopifyDiscountId");
