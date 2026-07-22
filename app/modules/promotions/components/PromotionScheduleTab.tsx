import type { PromotionRecord } from "../models/promotion";

type PromotionScheduleTabProps = {
  promotion: PromotionRecord;
};

function formatDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function PromotionScheduleTab({
  promotion,
}: PromotionScheduleTabProps) {
  const schedule = promotion.shopify.schedule;
  const status = promotion.shopify.general.status;

  return (
    <s-stack direction="block" gap="large">
      <s-section heading="Promotion schedule">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Starts: {formatDate(schedule.startsAt)}
          </s-paragraph>

          <s-paragraph>
            Ends: {formatDate(schedule.endsAt)}
          </s-paragraph>

          <s-paragraph>
            Current status: {status}
          </s-paragraph>
        </s-stack>
      </s-section>

      {!schedule.endsAt && (
        <s-banner tone="info">
          This promotion does not currently have an end date.
        </s-banner>
      )}
    </s-stack>
  );
}
