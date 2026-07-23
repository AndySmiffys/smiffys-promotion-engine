import db from "../../../db.server";

import type { PromotionRecord } from "../models/promotion";

import type {
  PromotionWebsiteSettings,
} from "../models/website";

type StoredPromotionSettings = {
  included: boolean;
  websiteEnabled: boolean;

  showProductPage: boolean;
  showCollectionPage: boolean;
  showProductBadge: boolean;
  showCountdown: boolean;
  showHeaderBanner: boolean;

  headline: string | null;
  body: string | null;
  badgeText: string | null;
  countdownText: string | null;
  buttonText: string | null;
  buttonUrl: string | null;

  backgroundColour: string | null;
  textColour: string | null;
  badgeColour: string | null;

  priority: number;

  lastSyncedAt: Date | null;
  lastSyncError: string | null;
};

function mapStoredSettings(
  settings: StoredPromotionSettings,
): PromotionWebsiteSettings {
  return {
    included: settings.included,
    websiteEnabled: settings.websiteEnabled,

    showProductPage: settings.showProductPage,
    showCollectionPage: settings.showCollectionPage,
    showProductBadge: settings.showProductBadge,
    showCountdown: settings.showCountdown,
    showHeaderBanner: settings.showHeaderBanner,

    headline: settings.headline,
    body: settings.body,
    badgeText: settings.badgeText,
    countdownText: settings.countdownText,
    buttonText: settings.buttonText,
    buttonUrl: settings.buttonUrl,

    backgroundColour: settings.backgroundColour,
    textColour: settings.textColour,
    badgeColour: settings.badgeColour,

    priority: settings.priority,

    lastSyncedAt:
      settings.lastSyncedAt?.toISOString() ?? null,

    lastSyncError: settings.lastSyncError,
  };
}

export async function attachPromotionSettings(
  shop: string,
  promotions: PromotionRecord[],
): Promise<PromotionRecord[]> {
  if (promotions.length === 0) {
    return [];
  }

  const storedSettings =
    await db.promotionSettings.findMany({
      where: {
        shop,

        shopifyDiscountId: {
          in: promotions.map(
            (promotion) => promotion.id,
          ),
        },
      },
    });

  const settingsByDiscountId = new Map(
    storedSettings.map((settings) => [
      settings.shopifyDiscountId,
      settings,
    ]),
  );

  return promotions.map((promotion) => {
    const stored =
      settingsByDiscountId.get(promotion.id);

    if (!stored) {
      return promotion;
    }

    return {
      ...promotion,

      settings: mapStoredSettings(stored),
    };
  });
}

export type UpdatePromotionWebsiteSettingsInput = {
  included: boolean;
  websiteEnabled: boolean;

  showProductPage: boolean;
  showCollectionPage: boolean;
  showProductBadge: boolean;
  showCountdown: boolean;
  showHeaderBanner: boolean;

  headline: string | null;
  body: string | null;
  badgeText: string | null;
  countdownText: string | null;
  buttonText: string | null;
  buttonUrl: string | null;

  backgroundColour: string | null;
  textColour: string | null;
  badgeColour: string | null;

  priority: number;
};

export async function updatePromotionWebsiteSettings(
  shop: string,
  shopifyDiscountId: string,
  input: UpdatePromotionWebsiteSettingsInput,
): Promise<void> {
  await db.promotionSettings.upsert({
    where: {
      shop_shopifyDiscountId: {
        shop,
        shopifyDiscountId,
      },
    },

    create: {
      shop,
      shopifyDiscountId,

      included: input.included,
      websiteEnabled: input.websiteEnabled,

      showProductPage: input.showProductPage,
      showCollectionPage:
        input.showCollectionPage,
      showProductBadge:
        input.showProductBadge,
      showCountdown: input.showCountdown,
      showHeaderBanner:
        input.showHeaderBanner,

      headline: input.headline,
      body: input.body,
      badgeText: input.badgeText,
      countdownText: input.countdownText,
      buttonText: input.buttonText,
      buttonUrl: input.buttonUrl,

      backgroundColour:
        input.backgroundColour,
      textColour: input.textColour,
      badgeColour: input.badgeColour,

      priority: input.priority,
    },

    update: {
      included: input.included,
      websiteEnabled: input.websiteEnabled,

      showProductPage: input.showProductPage,
      showCollectionPage:
        input.showCollectionPage,
      showProductBadge:
        input.showProductBadge,
      showCountdown: input.showCountdown,
      showHeaderBanner:
        input.showHeaderBanner,

      headline: input.headline,
      body: input.body,
      badgeText: input.badgeText,
      countdownText: input.countdownText,
      buttonText: input.buttonText,
      buttonUrl: input.buttonUrl,

      backgroundColour:
        input.backgroundColour,
      textColour: input.textColour,
      badgeColour: input.badgeColour,

      priority: input.priority,
    },
  });
}
