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
        flex: "1 1 180px",
        minWidth: "180px",
        padding: "16px",
        border: "1px solid #d9d9d9",
        borderRadius: "12px",
        backgroundColor: "#ffffff",
      }}
    >
      <s-stack direction="block" gap="small">
        <s-paragraph>{label}</s-paragraph>

        <div
          style={{
            fontSize: "24px",
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>

        <div
          style={{
            color: "#616161",
            fontSize: "13px",
            lineHeight: 1.4,
          }}
        >
          {description}
        </div>
      </s-stack>
    </div>
  );
}
