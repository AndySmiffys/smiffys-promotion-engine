export type PromotionProductStatus =
  | "ACTIVE"
  | "DRAFT"
  | "ARCHIVED"
  | "UNLISTED"
  | "UNKNOWN";

export type PromotionCoverageCollection = {
  id: string;
  title: string;

  /**
   * Number of product entries found in this collection.
   */
  productCount: number;

  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  unlistedProducts: number;

  outOfStockProducts: number;
  totalInventory: number;
};

export type PromotionCoverage = {
  /**
   * Number of collections selected by the promotion.
   */
  selectedCollections: number;

  /**
   * Total product memberships across all selected collections.
   *
   * A product in two collections is counted twice here.
   */
  combinedCollectionEntries: number;

  /**
   * Number of distinct Shopify products covered.
   */
  uniqueProducts: number;

  /**
   * Additional collection memberships caused by products appearing
   * in more than one selected collection.
   */
  duplicateMemberships: number;

  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  unlistedProducts: number;

  outOfStockProducts: number;
  totalInventory: number;

vendorSummary: PromotionCoverageSummaryItem[];
productTypeSummary: PromotionCoverageSummaryItem[];

vendors: number;
productTypes: number;

  collections: PromotionCoverageCollection[];
};

export type PromotionCoverageSummaryItem = {
  name: string;
  productCount: number;
};
