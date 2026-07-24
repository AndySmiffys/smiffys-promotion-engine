type DashboardCardProps = {
  title: string;
  description: string;
  status: string;
  href?: string;
  actionLabel?: string;
  icon: string;
  accent: string;
  background: string;
};

function DashboardCard({
  title,
  description,
  status,
  href,
  actionLabel = "Open",
  icon,
  accent,
  background,
}: DashboardCardProps) {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "220px",
        overflow: "hidden",
        border: "1px solid #dedede",
        borderRadius: "16px",
        background: "linear-gradient(145deg, #ffffff 0%, #fafafa 100%)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        padding: "22px",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "110px",
          height: "110px",
          borderRadius: "0 0 0 110px",
          background,
          opacity: 0.9,
        }}
      />

      <s-stack direction="block" gap="large">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "52px",
              height: "52px",
              borderRadius: "15px",
              background,
              color: accent,
              fontSize: "26px",
              fontWeight: 700,
            }}
          >
            {icon}
          </div>

          <s-badge tone={href ? "success" : "neutral"}>{status}</s-badge>
        </div>

        <s-stack direction="block" gap="small">
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>

          <div
            style={{
              maxWidth: "34ch",
              color: "#616161",
              fontSize: "14px",
              lineHeight: 1.55,
            }}
          >
            {description}
          </div>
        </s-stack>

        <div style={{ marginTop: "auto" }}>
          {href ? (
            <s-button href={href} variant="primary">
              {actionLabel} →
            </s-button>
          ) : (
            <s-button disabled variant="secondary">
              Coming soon
            </s-button>
          )}
        </div>
      </s-stack>
    </section>
  );
}

export default function DashboardPage() {
  return (
    <s-page heading="Smiffys Toolkit">
      <s-stack direction="block" gap="large">
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            border: "1px solid #dedede",
            borderRadius: "16px",
            background: "linear-gradient(145deg, #ffffff 0%, #f8fbff 100%)",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            padding: "28px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-48px",
              right: "-36px",
              width: "190px",
              height: "190px",
              borderRadius: "50%",
              background: "#eaf4ff",
            }}
          />

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 66px",
                  width: "66px",
                  height: "66px",
                  borderRadius: "18px",
                  background: "#e3f1df",
                  color: "#1a7f37",
                  fontSize: "31px",
                }}
              >
                ✦
              </div>

              <s-stack direction="block" gap="small">
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 750,
                    lineHeight: 1.15,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Smiffys internal toolkit
                </div>

                <div
                  style={{
                    maxWidth: "62ch",
                    color: "#616161",
                    fontSize: "15px",
                    lineHeight: 1.55,
                  }}
                >
                  Manage promotions and access the operational tools used across the Smiffys ecommerce team.
                </div>
              </s-stack>
            </div>

            <s-badge tone="success">Toolkit online</s-badge>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          <DashboardCard
            title="Promotion Centre"
            description="View Shopify promotions, check offer health and control website promotion settings from one place."
            status="Available"
            href="/app/promotions"
            actionLabel="Open promotions"
            icon="%"
            accent="#1a7f37"
            background="#e3f1df"
          />

          <DashboardCard
            title="Product Tools"
            description="Product validation, catalogue workflows and ecommerce merchandising tools will live here."
            status="Planned"
            icon="◇"
            accent="#6f42c1"
            background="#f0e8ff"
          />

          <DashboardCard
            title="Reports"
            description="Performance reporting, promotion analytics and operational summaries will be available here."
            status="Planned"
            icon="↗"
            accent="#005bd3"
            background="#eaf4ff"
          />
        </div>

        <section
          style={{
            border: "1px solid #dedede",
            borderRadius: "16px",
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            padding: "22px",
          }}
        >
          <s-stack direction="block" gap="base">
            <div
              style={{
                fontSize: "17px",
                fontWeight: 700,
              }}
            >
              Toolkit roadmap
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "12px",
              }}
            >
              <RoadmapItem label="Promotion Centre" value="Live" tone="success" />
              <RoadmapItem label="Product Tools" value="Planned" tone="neutral" />
              <RoadmapItem label="Reports" value="Planned" tone="neutral" />
              <RoadmapItem label="Additional tools" value="Future" tone="neutral" />
            </div>
          </s-stack>
        </section>
      </s-stack>
    </s-page>
  );
}

function RoadmapItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "neutral";
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        border: "1px solid #eeeeee",
        borderRadius: "12px",
        background: "#fafafa",
        padding: "14px",
      }}
    >
      <s-text fontWeight="semibold">{label}</s-text>
      <s-badge tone={tone}>{value}</s-badge>
    </div>
  );
}
