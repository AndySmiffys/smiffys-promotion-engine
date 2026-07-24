export type PromotionTab =
  | "general"
  | "products"
  | "customers"
  | "conditions"
  | "schedule"
  | "website"
  | "messages";

type PromotionTabsProps = {
  activeTab: PromotionTab;
  onChange: (tab: PromotionTab) => void;
};

const tabs: Array<{
  id: PromotionTab;
  label: string;
}> = [
  { id: "general", label: "Overview" },
  { id: "products", label: "Products" },
  { id: "customers", label: "Customers" },
  { id: "conditions", label: "Conditions" },
  { id: "schedule", label: "Schedule" },
  { id: "website", label: "Website" },
  { id: "messages", label: "Messages" },
];

export function PromotionTabs({
  activeTab,
  onChange,
}: PromotionTabsProps) {
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
      <style>{`
        body:has([data-promotion-type="Order"])
          [data-promotion-tab="products"],
        body:has([data-promotion-type="BXGY"])
          [data-promotion-tab="products"] {
          display: none;
        }
      `}</style>

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
              data-promotion-tab={tab.id}
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
