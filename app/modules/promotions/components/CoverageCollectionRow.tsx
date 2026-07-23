type CoverageCollectionRowProps = {
  title: string;
  productCount: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  unlistedProducts: number;
  outOfStockProducts: number;
  totalInventory: number;
  isLast?: boolean;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function CoverageCollectionRow({
  title,
  productCount,
  activeProducts,
  draftProducts,
  archivedProducts,
  unlistedProducts,
  outOfStockProducts,
  totalInventory,
  isLast = false,
}: CoverageCollectionRowProps) {
  return (
    <div
      style={{
        padding: "16px 0",
        borderBottom: isLast
          ? "none"
          : "1px solid #eeeeee",
      }}
    >
      <s-stack direction="block" gap="base">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div
            style={{
              minWidth: 0,
              fontWeight: 600,
              overflowWrap: "anywhere",
            }}
          >
            {title}
          </div>

          <s-badge>
            {formatNumber(productCount)}{" "}
            {productCount === 1
              ? "product"
              : "products"}
          </s-badge>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <s-badge tone="success">
            {formatNumber(activeProducts)} active
          </s-badge>

          {draftProducts > 0 && (
            <s-badge tone="warning">
              {formatNumber(draftProducts)} draft
            </s-badge>
          )}

          {archivedProducts > 0 && (
            <s-badge tone="critical">
              {formatNumber(archivedProducts)} archived
            </s-badge>
          )}

          {unlistedProducts > 0 && (
            <s-badge tone="info">
              {formatNumber(unlistedProducts)} unlisted
            </s-badge>
          )}

          <s-badge
            tone={
              outOfStockProducts > 0
                ? "warning"
                : "success"
            }
          >
            {formatNumber(outOfStockProducts)} out of stock
          </s-badge>

          <s-badge>
            {formatNumber(totalInventory)} total inventory
          </s-badge>
        </div>
      </s-stack>
    </div>
  );
}
