import { useEmbeddedAppUrl } from "../modules/navigation/embeddedAppUrl";
type DashboardItemProps = {
  title: string;
  description: string;
  status: string;
  href?: string;
};

function DashboardItem({
  title,
  description,
  status,
  href,
}: DashboardItemProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        padding: "18px 20px",
        borderTop: "1px solid #ebebeb",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: "#202223",
            fontSize: "15px",
            fontWeight: 650,
            lineHeight: 1.35,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: "4px",
            color: "#616161",
            fontSize: "13px",
            lineHeight: 1.45,
          }}
        >
          {description}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flex: "0 0 auto",
        }}
      >
        <s-badge tone={href ? "success" : "neutral"}>{status}</s-badge>
        {href && (
          <s-button href={href} variant="secondary">
            Open
          </s-button>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const appUrl = useEmbeddedAppUrl();
  return (
    <s-page heading="Home">
      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
        }}
      >
        <s-stack direction="block" gap="large">
          <div>
            <div
              style={{
                color: "#202223",
                fontSize: "20px",
                fontWeight: 700,
                lineHeight: 1.3,
              }}
            >
              Smiffys Promotion Engine
            </div>
            <div
              style={{
                marginTop: "6px",
                maxWidth: "680px",
                color: "#616161",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              Manage Shopify promotions and the website settings that sit alongside them.
            </div>
          </div>

          <section>
            <div
              style={{
                marginBottom: "8px",
                color: "#202223",
                fontSize: "14px",
                fontWeight: 650,
              }}
            >
              Tools
            </div>

            <div
              style={{
                overflow: "hidden",
                border: "1px solid #dedede",
                borderRadius: "12px",
                background: "#ffffff",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div
                style={{
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    color: "#202223",
                    fontSize: "16px",
                    fontWeight: 650,
                  }}
                >
                  Available tools
                </div>
                <div
                  style={{
                    marginTop: "4px",
                    color: "#616161",
                    fontSize: "13px",
                  }}
                >
                  Open a tool to manage its Shopify and website configuration.
                </div>
              </div>

              <DashboardItem
                title="Promotions"
                description="Review discounts, eligibility, conditions, schedules and website promotion settings."
                status="Available"
                href={appUrl("/app/promotions")}
              />
              <DashboardItem
                title="Product tools"
                description="Product validation and catalogue workflows."
                status="Planned"
              />
              <DashboardItem
                title="Reports"
                description="Promotion and ecommerce performance reporting."
                status="Planned"
              />
            </div>
          </section>
        </s-stack>
      </div>
    </s-page>
  );
}
