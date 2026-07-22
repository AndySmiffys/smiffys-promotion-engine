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
};
