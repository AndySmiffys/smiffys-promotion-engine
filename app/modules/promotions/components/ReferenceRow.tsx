type ReferenceRowProps = {
  title: string;
  typeLabel: string;
  isLast?: boolean;
};

export function ReferenceRow({
  title,
  typeLabel,
  isLast = false,
}: ReferenceRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        padding: "12px 0",
        borderBottom: isLast
          ? "none"
          : "1px solid #eeeeee",
      }}
    >
      <div
        style={{
          minWidth: 0,
          fontWeight: 500,
          overflowWrap: "anywhere",
        }}
      >
        {title}
      </div>

      <s-badge>{typeLabel}</s-badge>
    </div>
  );
}
