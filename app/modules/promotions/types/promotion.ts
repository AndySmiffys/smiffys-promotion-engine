export type PromotionMethod = "Code" | "Automatic";

export type PromotionType =
  | "Product"
  | "Order"
  | "Shipping"
  | "Buy X get Y"
  | "Unknown";

export type PromotionStatus =
  | "ACTIVE"
  | "SCHEDULED"
  | "EXPIRED"
  | "UNKNOWN";

export type PromotionWebsiteSettings = {
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

  lastSyncedAt: string | null;
  lastSyncError: string | null;
};

export type Promotion = {
  id: string;
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

  settings: PromotionWebsiteSettings;
};
