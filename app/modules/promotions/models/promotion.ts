import type {
  PromotionMethod,
  PromotionStatus,
  PromotionType,
  ShopifyPromotion,
} from "./shopify";

import type { PromotionWebsiteSettings } from "./website";

/**
 * Main promotion model used by the application.
 *
 * The flattened Shopify properties are temporary compatibility fields.
 * They allow the existing routes and components to keep working while
 * they are gradually migrated to `promotion.shopify`.
 */
export type PromotionRecord = {
  id: string;
  routeId: string;

  /*
  |--------------------------------------------------------------------------
  | Temporary compatibility fields
  |--------------------------------------------------------------------------
  */

  title: string;
  summary: string;

  method: PromotionMethod;
  type: PromotionType;
  status: PromotionStatus;

  value: string;
  code: string | null;

  appliesTo: string;
  minimumRequirement: string;

  createdBy: string;
  includedInSync: boolean;

  startsAt: string | null;
  endsAt: string | null;

  /*
  |--------------------------------------------------------------------------
  | New structured model
  |--------------------------------------------------------------------------
  */

  shopify: ShopifyPromotion;
  settings: PromotionWebsiteSettings;
};
