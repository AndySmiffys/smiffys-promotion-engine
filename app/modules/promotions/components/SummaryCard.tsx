type SummaryCardProps = {
  label: string;
  value: number | string;
  description: string;
};

export function SummaryCard({
  label,
  value,
  description,
}: SummaryCardProps) {
  return (
    <div
      style={{
        position: "relative",
        flex: "1 1 210px",
        minWidth: "210px",
        overflow: "hidden",
        padding: "20px",
        border: "1px solid #e3e3e3",
        borderRadius: "16px",
        background:
          "linear-gradient(145deg, #ffffff 0%, #fafafa 100%)",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "72px",
          height: "72px",
          borderRadius: "0 0 0 72px",
          backgroundColor: "#f1f1f1",
          opacity: 0.75,
        }}
      />

      <div style={{ position: "relative" }}>
        <s-stack direction="block" gap="small">
          <div
            style={{
              color: "#616161",
              fontSize: "12px",
              fontWeight: 650,
              letterSpacing: "0.06em",
              lineHeight: 1.3,
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>

          <div
            style={{
              color: "#202223",
              fontSize: "30px",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}
          >
            {value}
          </div>

          <div
            style={{
              maxWidth: "30ch",
              color: "#616161",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
        </s-stack>
      </div>
    </div>
  );
}
