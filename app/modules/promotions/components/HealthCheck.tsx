export type HealthCheckTone =
  | "success"
  | "warning"
  | "critical"
  | "info";

type HealthCheckProps = {
  tone: HealthCheckTone;
  title: string;
  description: string;
  isLast?: boolean;
};

export function HealthCheck({
  tone,
  title,
  description,
  isLast = false,
}: HealthCheckProps) {
  const symbol =
    tone === "success"
      ? "✓"
      : tone === "critical"
        ? "!"
        : "•";

  const symbolBackground =
    tone === "success"
      ? "#e3f1df"
      : tone === "critical"
        ? "#fee9e8"
        : tone === "warning"
          ? "#fff1d6"
          : "#eaf4ff";

  const symbolColour =
    tone === "success"
      ? "#1a7f37"
      : tone === "critical"
        ? "#b42318"
        : tone === "warning"
          ? "#8a6116"
          : "#005bd3";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 0",
        borderBottom: isLast
          ? "none"
          : "1px solid #eeeeee",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 28px",
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          backgroundColor: symbolBackground,
          color: symbolColour,
          fontSize: "16px",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {symbol}
      </div>

      <div
        style={{
          minWidth: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            marginBottom: "3px",
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          {title}
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
      </div>
    </div>
  );
}
