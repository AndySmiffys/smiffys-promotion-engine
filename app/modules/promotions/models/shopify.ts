export type PromotionMethod =
  | "Code"
  | "Automatic";

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

export type PromotionCapabilities = {
  supportsProducts: boolean;
  supportsShipping: boolean;
  supportsCustomers: boolean;
  supportsConditions: boolean;
  supportsCombinations: boolean;
  supportsWebsiteBadge: boolean;
  supportsCountdown: boolean;
  supportsLandingPage: boolean;
  supportsAnalytics: boolean;
  supportsHealthChecks: boolean;
};

export type PromotionGeneral = {
  title: string;
  summary: string;

  method: PromotionMethod;
  type: PromotionType;
  status: PromotionStatus;

  value: string;
  code: string | null;

  createdBy: string;
};

export type PromotionProductReference = {
  id: string;
  title: string;
};

export type PromotionVariantReference = {
  id: string;
  title: string;
};

export type PromotionCollectionReference = {
  id: string;
  title: string;
};

export type PromotionProducts = {
  appliesTo: string;

  allProducts: boolean;

  products: PromotionProductReference[];
  variants: PromotionVariantReference[];
  collections: PromotionCollectionReference[];
};

export type PromotionShipping = {
  appliesTo: string;
  allCountries: boolean;
  countries: string[];

  maximumShippingPrice: {
    amount: string;
    currencyCode: string;
  } | null;

  appliesOnOneTimePurchase: boolean;
  appliesOnSubscription: boolean;
};

export type PromotionCustomers = {
  appliesToAllCustomers: boolean;

  customers: Array<{
    id: string;
    name: string;
  }>;

  segments: Array<{
    id: string;
    name: string;
  }>;
};

export type PromotionConditions = {
  minimumRequirement: string;

  minimumSubtotal: {
    amount: string;
    currencyCode: string;
  } | null;

  minimumQuantity: number | null;

  usageLimit: number | null;
  appliesOncePerCustomer: boolean;
};

export type PromotionSchedule = {
  startsAt: string | null;
  endsAt: string | null;
};

export type PromotionCombinations = {
  orderDiscounts: boolean;
  productDiscounts: boolean;
  shippingDiscounts: boolean;
};

export type ShopifyPromotion = {
  general: PromotionGeneral;
  capabilities: PromotionCapabilities;
  products: PromotionProducts;
  shipping: PromotionShipping | null;
  customers: PromotionCustomers;
  conditions: PromotionConditions;
  schedule: PromotionSchedule;
  combinations: PromotionCombinations;
};
