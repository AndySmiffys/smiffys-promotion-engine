import { GET_COLLECTION_COVERAGE_PAGE } from "./coverage.graphql";

import type {
  PromotionCoverage,
  PromotionCoverageCollection,
  PromotionCoverageSummaryItem,
  PromotionProductStatus,
} from "./coverage";

const PRODUCTS_PER_PAGE = 250;

type ShopifyAdminClient = {
  graphql: (
    query: string,
    options?: {
      variables?: Record<string, unknown>;
    },
  ) => Promise<Response>;
};

export type PromotionCoverageCollectionReference = {
  id: string;
  title: string;
};

type CollectionCoverageProduct = {
  id: string;
  title: string;
  handle: string;
  status: PromotionProductStatus | string;
  vendor: string;
  productType: string;
  totalInventory: number | null;
};

type CollectionCoverageResponse = {
  data?: {
    collection?: {
      id: string;
      title: string;

      products: {
        nodes: CollectionCoverageProduct[];

        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
      };
    } | null;
  };

  errors?: Array<{
    message: string;
  }>;
};

type UniqueProductRecord = {
  id: string;
  status: PromotionProductStatus;
  vendor: string;
  productType: string;
  totalInventory: number;
};

type LoadedCollection = {
  id: string;
  title: string;
  products: CollectionCoverageProduct[];
};

function normaliseStatus(
  status: string,
): PromotionProductStatus {
  switch (status) {
    case "ACTIVE":
    case "DRAFT":
    case "ARCHIVED":
    case "UNLISTED":
      return status;

    default:
      return "UNKNOWN";
  }
}

function normaliseInventory(
  totalInventory: number | null | undefined,
): number {
  if (
    typeof totalInventory !== "number" ||
    !Number.isFinite(totalInventory)
  ) {
    return 0;
  }

  return totalInventory;
}

function isOutOfStock(
  totalInventory: number,
): boolean {
  return totalInventory <= 0;
}

function incrementStatusCount(
  counts: {
    activeProducts: number;
    draftProducts: number;
    archivedProducts: number;
    unlistedProducts: number;
  },
  status: PromotionProductStatus,
): void {
  switch (status) {
    case "ACTIVE":
      counts.activeProducts += 1;
      break;

    case "DRAFT":
      counts.draftProducts += 1;
      break;

    case "ARCHIVED":
      counts.archivedProducts += 1;
      break;

    case "UNLISTED":
      counts.unlistedProducts += 1;
      break;

    default:
      break;
  }
}

async function loadCollectionProducts(
  admin: ShopifyAdminClient,
  collectionReference: PromotionCoverageCollectionReference,
): Promise<LoadedCollection> {
  const products: CollectionCoverageProduct[] = [];

  let after: string | null = null;
  let hasNextPage = true;
  let collectionTitle = collectionReference.title;

  while (hasNextPage) {
    const response = await admin.graphql(
      GET_COLLECTION_COVERAGE_PAGE,
      {
        variables: {
          collectionId: collectionReference.id,
          first: PRODUCTS_PER_PAGE,
          after,
        },
      },
    );

    const result =
      (await response.json()) as CollectionCoverageResponse;

    if (result.errors?.length) {
      throw new Error(
        result.errors
          .map((error) => error.message)
          .join(", "),
      );
    }

    const collection = result.data?.collection;

    if (!collection) {
      throw new Error(
        `Collection could not be loaded: ${collectionReference.id}`,
      );
    }

    collectionTitle =
      collection.title || collectionReference.title;

    products.push(...collection.products.nodes);

    hasNextPage =
      collection.products.pageInfo.hasNextPage;

    const nextCursor =
      collection.products.pageInfo.endCursor;

    if (hasNextPage && !nextCursor) {
      throw new Error(
        `Shopify returned another page for collection "${collectionTitle}" without an end cursor.`,
      );
    }

    after = nextCursor;
  }

  return {
    id: collectionReference.id,
    title: collectionTitle,
    products,
  };
}

function analyseCollection(
  collection: LoadedCollection,
): PromotionCoverageCollection {
  const counts = {
    activeProducts: 0,
    draftProducts: 0,
    archivedProducts: 0,
    unlistedProducts: 0,
  };

  let outOfStockProducts = 0;
  let totalInventory = 0;

  for (const product of collection.products) {
    const status = normaliseStatus(product.status);

    const inventory = normaliseInventory(
      product.totalInventory,
    );

    incrementStatusCount(counts, status);

    totalInventory += inventory;

    if (isOutOfStock(inventory)) {
      outOfStockProducts += 1;
    }
  }

  return {
    id: collection.id,
    title: collection.title,

    productCount: collection.products.length,

    activeProducts: counts.activeProducts,
    draftProducts: counts.draftProducts,
    archivedProducts: counts.archivedProducts,
    unlistedProducts: counts.unlistedProducts,

    outOfStockProducts,
    totalInventory,
  };
}

export async function getPromotionCoverage(
  admin: ShopifyAdminClient,
  collectionReferences: PromotionCoverageCollectionReference[],
): Promise<PromotionCoverage> {
  if (collectionReferences.length === 0) {
    return {
      selectedCollections: 0,
      combinedCollectionEntries: 0,
      uniqueProducts: 0,
      duplicateMemberships: 0,

      activeProducts: 0,
      draftProducts: 0,
      archivedProducts: 0,
      unlistedProducts: 0,

      outOfStockProducts: 0,
      totalInventory: 0,

      vendorSummary: [],
      productTypeSummary: [],

      vendors: 0,
      productTypes: 0,

      collections: [],
    };
  }

  /*
   * Load collections sequentially for now.
   *
   * This is intentionally conservative with Shopify API usage.
   * We can add controlled concurrency later if necessary.
   */
  const loadedCollections: LoadedCollection[] = [];

  for (const collectionReference of collectionReferences) {
    const collection = await loadCollectionProducts(
      admin,
      collectionReference,
    );

    loadedCollections.push(collection);
  }

  const collectionBreakdown =
    loadedCollections.map(analyseCollection);

  const uniqueProducts =
    new Map<string, UniqueProductRecord>();

  let combinedCollectionEntries = 0;

  for (const collection of loadedCollections) {
    combinedCollectionEntries +=
      collection.products.length;

    for (const product of collection.products) {
      /*
       * Only add the first occurrence.
       *
       * If a product belongs to several selected collections,
       * its status and inventory must only be counted once in
       * the overall promotion totals.
       */
      if (uniqueProducts.has(product.id)) {
        continue;
      }

      uniqueProducts.set(product.id, {
        id: product.id,

        status: normaliseStatus(product.status),

        vendor: product.vendor.trim(),

        productType: product.productType.trim(),

        totalInventory: normaliseInventory(
          product.totalInventory,
        ),
      });
    }
  }

  const overallCounts = {
    activeProducts: 0,
    draftProducts: 0,
    archivedProducts: 0,
    unlistedProducts: 0,
  };

  const vendorMap = new Map<
    string,
    PromotionCoverageSummaryItem
  >();

  const productTypeMap = new Map<
    string,
    PromotionCoverageSummaryItem
  >();

  let outOfStockProducts = 0;
  let totalInventory = 0;

  for (const product of uniqueProducts.values()) {
    incrementStatusCount(
      overallCounts,
      product.status,
    );

    totalInventory += product.totalInventory;

    if (isOutOfStock(product.totalInventory)) {
      outOfStockProducts += 1;
    }

    if (product.vendor) {
      const key = product.vendor.trim();

      const existing = vendorMap.get(key);

      if (existing) {
        existing.productCount++;
      } else {
        vendorMap.set(key, {
          name: key,
          productCount: 1,
        });
      }
    }

    if (product.productType) {
      const key = product.productType.trim();

      const existing = productTypeMap.get(key);

      if (existing) {
        existing.productCount++;
      } else {
        productTypeMap.set(key, {
          name: key,
          productCount: 1,
        });
      }
    }
  }

  const vendorSummary = [...vendorMap.values()].sort(
    (a, b) =>
      b.productCount - a.productCount ||
      a.name.localeCompare(b.name),
  );

  const productTypeSummary = [...productTypeMap.values()].sort(
    (a, b) =>
      b.productCount - a.productCount ||
      a.name.localeCompare(b.name),
  );

  const uniqueProductCount =
    uniqueProducts.size;

  return {
    selectedCollections:
      collectionReferences.length,

    combinedCollectionEntries,

    uniqueProducts: uniqueProductCount,

    duplicateMemberships: Math.max(
      0,
      combinedCollectionEntries -
      uniqueProductCount,
    ),

    activeProducts:
      overallCounts.activeProducts,

    draftProducts:
      overallCounts.draftProducts,

    archivedProducts:
      overallCounts.archivedProducts,

    unlistedProducts:
      overallCounts.unlistedProducts,

    outOfStockProducts,
    totalInventory,

    vendorSummary,
    productTypeSummary,

    vendors: vendorSummary.length,
    productTypes: productTypeSummary.length,

    collections: collectionBreakdown,
  };
}
