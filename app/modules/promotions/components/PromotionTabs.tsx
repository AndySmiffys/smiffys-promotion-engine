import type { PromotionRecord } from "../models/promotion";

export type PromotionTab =
  | "general"
  | "products"
  | "bxgy"
  | "shipping"
  | "customers"
  | "conditions"
  | "schedule"
  | "website"
  | "messages";

type PromotionTabsProps = {
  promotion: PromotionRecord;
  activeTab: PromotionTab;
  onChange: (tab: PromotionTab) => void;
};

type PromotionTabDefinition = {
  id: PromotionTab;
  label: string;
};

function getTabs(
  promotion: PromotionRecord,
): PromotionTabDefinition[] {
  const capabilities = promotion.shopify.capabilities;
  const tabs: PromotionTabDefinition[] = [
    { id: "general", label: "Overview" },
  ];

  if (promotion.shopify.bxgy) {
    tabs.push({ id: "bxgy", label: "Buy & Get" });
  } else if (capabilities.supportsShipping) {
    tabs.push({ id: "shipping", label: "Shipping" });
  } else if (capabilities.supportsProducts) {
    tabs.push({ id: "products", label: "Products" });
  }

  if (capabilities.supportsCustomers) {
    tabs.push({ id: "customers", label: "Customers" });
  }

  if (capabilities.supportsConditions) {
    tabs.push({ id: "conditions", label: "Conditions" });
  }

  tabs.push({ id: "schedule", label: "Schedule" });

  if (
    capabilities.supportsWebsiteBadge ||
    capabilities.supportsCountdown ||
    capabilities.supportsLandingPage
  ) {
    tabs.push({ id: "website", label: "Website" });
    tabs.push({ id: "messages", label: "Messages" });
  }

  return tabs;
}

export function PromotionTabs({
  promotion,
  activeTab,
  onChange,
}: PromotionTabsProps) {
  const tabs = getTabs(promotion);

  return (
    <nav
      aria-label="Promotion sections"
      style={{
        overflowX: "auto",
        padding: "4px",
        border: "1px solid #e3e3e3",
        borderRadius: "12px",
        background: "#f6f6f7",
      }}
    >
      <div
        role="tablist"
        style={{
          display: "flex",
          minWidth: "max-content",
          gap: "4px",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              style={{
                appearance: "none",
                border: isActive
                  ? "1px solid #d4d4d4"
                  : "1px solid transparent",
                borderRadius: "8px",
                padding: "9px 14px",
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#202223" : "#616161",
                boxShadow: isActive
                  ? "0 1px 2px rgba(0, 0, 0, 0.08)"
                  : "none",
                font: "inherit",
                fontWeight: isActive ? 650 : 500,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition:
                  "background 120ms ease, color 120ms ease, box-shadow 120ms ease",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
