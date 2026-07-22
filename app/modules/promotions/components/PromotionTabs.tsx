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
    { id: "general", label: "General" },
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
    <s-section>
      <div
        role="tablist"
        aria-label="Promotion sections"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <s-button
              key={tab.id}
              type="button"
              variant={isActive ? "primary" : "secondary"}
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </s-button>
          );
        })}
      </div>
    </s-section>
  );
}
