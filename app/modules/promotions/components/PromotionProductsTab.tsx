import type { PromotionCoverage } from "../coverage/coverage";
import type { PromotionRecord } from "../models/promotion";

import { BreakdownList } from "./BreakdownList";
import { CoverageCollectionRow } from "./CoverageCollectionRow";
import { HealthCheck } from "./HealthCheck";
import { ReferenceRow } from "./ReferenceRow";
import { SummaryCard } from "./SummaryCard";

type PromotionProductsTabProps = {
  promotion: PromotionRecord;
  coverage: PromotionCoverage | null;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function PromotionProductsTab({
  promotion,
  coverage,
}: PromotionProductsTabProps) {
  const products = promotion.shopify.products;
  const promotionType = promotion.shopify.general.type;

  const collectionCount = products.collections.length;
  const productCount = products.products.length;
  const variantCount = products.variants.length;

  const hasSpecificTargets =
    collectionCount > 0 ||
    productCount > 0 ||
    variantCount > 0;

  const appliesToEverything = products.allProducts;
  const isOrderDiscount = promotionType === "Order";

  const hasCollectionCoverage =
    coverage !== null &&
    coverage.selectedCollections > 0;

  const hasHealthIssues =
    hasCollectionCoverage &&
    (coverage.draftProducts > 0 ||
      coverage.archivedProducts > 0 ||
      coverage.unlistedProducts > 0 ||
      coverage.outOfStockProducts > 0);

  return (
    <s-stack direction="block" gap="large">
      <s-section heading="Promotion target">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Applies to: {products.appliesTo}
          </s-paragraph>

          {appliesToEverything ? (
            <s-banner tone="success">
              {isOrderDiscount
                ? "This order discount applies across the full catalogue. No collection, product or variant restrictions have been configured."
                : "This promotion applies to every product in the catalogue. No collection, product or variant restrictions have been configured."}
            </s-banner>
          ) : hasSpecificTargets ? (
            <s-banner tone="info">
              This promotion is limited to selected
              collections, products or variants.
            </s-banner>
          ) : (
            <s-banner tone="warning">
              Shopify did not return any product targeting
              information for this promotion.
            </s-banner>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {appliesToEverything ? (
              <>
                <SummaryCard
                  label="Collections"
                  value="All"
                  description="All collections are eligible."
                />

                <SummaryCard
                  label="Products"
                  value="All"
                  description="All products are eligible."
                />

                <SummaryCard
                  label="Variants"
                  value="All"
                  description="All product variants are eligible."
                />

                <SummaryCard
                  label="Coverage"
                  value="All products"
                  description="The promotion has no product restrictions."
                />
              </>
            ) : (
              <>
                {collectionCount > 0 && (
                  <SummaryCard
                    label="Collections"
                    value={collectionCount}
                    description="Collections specifically included in this promotion."
                  />
                )}

                {productCount > 0 && (
                  <SummaryCard
                    label="Products"
                    value={productCount}
                    description="Individual products specifically included in this promotion."
                  />
                )}

                <SummaryCard
                  label="Coverage"
                  value="Selected"
                  description="The promotion is restricted to selected catalogue items."
                />
              </>
            )}
          </div>
        </s-stack>
      </s-section>

      {hasCollectionCoverage && (
        <>
          <s-section heading="Promotion coverage">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <SummaryCard
                label="Collections"
                value={coverage.selectedCollections}
                description="Selected collections included in this promotion."
              />

              <SummaryCard
                label="Products"
                value={coverage.uniqueProducts}
                description="Unique products covered by the selected collections."
              />
            </div>
          </s-section>

          <s-section heading="Promotion health">
            <s-stack direction="block" gap="base">
              <s-banner
                tone={
                  hasHealthIssues
                    ? "warning"
                    : "success"
                }
              >
                {hasHealthIssues
                  ? "This promotion contains products that may require attention."
                  : "No product status or inventory issues were found in this promotion."}
              </s-banner>

              <div>
                <HealthCheck
                  tone="success"
                  title={`${formatNumber(
                    coverage.activeProducts,
                  )} active ${coverage.activeProducts === 1
                      ? "product"
                      : "products"
                    }`}
                  description="These products are active in Shopify."
                />

                {coverage.draftProducts > 0 && (
                  <HealthCheck
                    tone="warning"
                    title={`${formatNumber(
                      coverage.draftProducts,
                    )} draft ${coverage.draftProducts === 1
                        ? "product is"
                        : "products are"
                      } included`}
                    description="Draft products are not normally available for customers to purchase."
                  />
                )}

                {coverage.archivedProducts > 0 && (
                  <HealthCheck
                    tone="critical"
                    title={`${formatNumber(
                      coverage.archivedProducts,
                    )} archived ${coverage.archivedProducts === 1
                        ? "product is"
                        : "products are"
                      } included`}
                    description="Archived products should be reviewed and may need removing from the selected collections."
                  />
                )}

                {coverage.unlistedProducts > 0 && (
                  <HealthCheck
                    tone="warning"
                    title={`${formatNumber(
                      coverage.unlistedProducts,
                    )} unlisted ${coverage.unlistedProducts === 1
                        ? "product is"
                        : "products are"
                      } included`}
                    description="Unlisted products have restricted catalogue visibility."
                  />
                )}

                <HealthCheck
                  tone={
                    coverage.outOfStockProducts > 0
                      ? "warning"
                      : "success"
                  }
                  title={
                    coverage.outOfStockProducts > 0
                      ? `${formatNumber(
                        coverage.outOfStockProducts,
                      )} out-of-stock ${coverage.outOfStockProducts === 1
                        ? "product is"
                        : "products are"
                      } included`
                      : "All covered products have inventory"
                  }
                  description={
                    coverage.outOfStockProducts > 0
                      ? "These products currently have total inventory of zero or less."
                      : "No out-of-stock products were found in the selected collections."
                  }
                  isLast
                />
              </div>
            </s-stack>
          </s-section>

          <s-section heading="Catalogue summary">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <SummaryCard
                label="Total inventory"
                value={formatNumber(
                  coverage.totalInventory,
                )}
                description="Combined inventory across all unique products covered."
              />

              <SummaryCard
                label="Vendors"
                value={coverage.vendorSummary.length}
                description="Distinct vendors represented in this promotion."
              />

              <SummaryCard
                label="Product types"
                value={coverage.productTypeSummary.length}
                description="Distinct product types represented in this promotion."
              />
            </div>
          </s-section>

          <s-section
            heading={`Vendors (${coverage.vendorSummary.length})`}
          >
            <BreakdownList
              items={coverage.vendorSummary}
              emptyMessage="No vendor information was found for the covered products."
            />
          </s-section>

          <s-section
            heading={`Product types (${coverage.productTypeSummary.length})`}
          >
            <BreakdownList
              items={coverage.productTypeSummary}
              emptyMessage="No product type information was found for the covered products."
            />
          </s-section>

          <s-section
            heading={`Collections (${coverage.collections.length})`}
          >
            <div>
              {coverage.collections.map(
                (collection, index) => (
                  <CoverageCollectionRow
                    key={collection.id}
                    title={collection.title}
                    productCount={
                      collection.productCount
                    }
                    activeProducts={
                      collection.activeProducts
                    }
                    draftProducts={
                      collection.draftProducts
                    }
                    archivedProducts={
                      collection.archivedProducts
                    }
                    unlistedProducts={
                      collection.unlistedProducts
                    }
                    outOfStockProducts={
                      collection.outOfStockProducts
                    }
                    totalInventory={
                      collection.totalInventory
                    }
                    isLast={
                      index ===
                      coverage.collections.length - 1
                    }
                  />
                ),
              )}
            </div>
          </s-section>
        </>
      )}

      {!hasCollectionCoverage &&
        collectionCount > 0 && (
          <s-section
            heading={`Collections (${collectionCount})`}
          >
            <div>
              {products.collections.map(
                (collection, index) => (
                  <ReferenceRow
                    key={collection.id}
                    title={collection.title}
                    typeLabel="Collection"
                    isLast={
                      index === collectionCount - 1
                    }
                  />
                ),
              )}
            </div>
          </s-section>
        )}

      {productCount > 0 && (
        <s-section
          heading={`Products (${productCount})`}
        >
          <div>
            {products.products.map(
              (product, index) => (
                <ReferenceRow
                  key={product.id}
                  title={product.title}
                  typeLabel="Product"
                  isLast={
                    index === productCount - 1
                  }
                />
              ),
            )}
          </div>
        </s-section>
      )}

      {variantCount > 0 && (
        <s-section
          heading={`Product variants (${variantCount})`}
        >
          <div>
            {products.variants.map(
              (variant, index) => (
                <ReferenceRow
                  key={variant.id}
                  title={variant.title}
                  typeLabel="Variant"
                  isLast={
                    index === variantCount - 1
                  }
                />
              ),
            )}
          </div>
        </s-section>
      )}

      {!appliesToEverything &&
        !hasSpecificTargets && (
          <s-section heading="No product details available">
            <s-paragraph>
              Shopify did not return collections, products or
              variants for this discount. The GraphQL query may
              need extending for this promotion type.
            </s-paragraph>
          </s-section>
        )}
    </s-stack>
  );
}
