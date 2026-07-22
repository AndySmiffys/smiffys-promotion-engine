import type { PromotionRecord } from "../models/promotion";

type PromotionProductsTabProps = {
  promotion: PromotionRecord;
};

export function PromotionProductsTab({
  promotion,
}: PromotionProductsTabProps) {
  const products = promotion.shopify.products;

  return (
    <s-stack direction="block" gap="large">
      <s-section heading="Product eligibility">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Applies to: {products.appliesTo}
          </s-paragraph>

          {products.allProducts && (
            <s-banner tone="success">
              This promotion applies to all products.
            </s-banner>
          )}
        </s-stack>
      </s-section>

      {products.collections.length > 0 && (
        <s-section heading="Collections">
          <s-stack direction="block" gap="small">
            {products.collections.map((collection) => (
              <s-paragraph key={collection.id}>
                {collection.title}
              </s-paragraph>
            ))}
          </s-stack>
        </s-section>
      )}

      {products.products.length > 0 && (
        <s-section heading="Products">
          <s-stack direction="block" gap="small">
            {products.products.map((product) => (
              <s-paragraph key={product.id}>
                {product.title}
              </s-paragraph>
            ))}
          </s-stack>
        </s-section>
      )}

      {products.variants.length > 0 && (
        <s-section heading="Product variants">
          <s-stack direction="block" gap="small">
            {products.variants.map((variant) => (
              <s-paragraph key={variant.id}>
                {variant.title}
              </s-paragraph>
            ))}
          </s-stack>
        </s-section>
      )}

      {!products.allProducts &&
        products.collections.length === 0 &&
        products.products.length === 0 &&
        products.variants.length === 0 && (
          <s-section heading="No product details available">
            <s-paragraph>
              Shopify did not return product, collection or
              variant targeting information for this discount.
            </s-paragraph>
          </s-section>
        )}
    </s-stack>
  );
}
