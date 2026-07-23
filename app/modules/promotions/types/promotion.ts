/**
 * Temporary compatibility exports.
 *
 * New code should import promotion models directly from:
 *
 * - ../models/promotion
 * - ../models/shopify
 * - ../models/website
 *
 * The `Promotion` alias remains temporarily so older files can
 * continue compiling while they are migrated to `PromotionRecord`.
 */

export type {
  PromotionMethod,
  PromotionStatus,
  PromotionType,
} from "../models/shopify";

export type {
  PromotionWebsiteSettings,
} from "../models/website";

export type {
  PromotionRecord,
} from "../models/promotion";

export type {
  PromotionRecord as Promotion,
} from "../models/promotion";
