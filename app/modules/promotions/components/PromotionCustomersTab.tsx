import type { PromotionRecord } from "../models/promotion";

type PromotionCustomersTabProps = {
  promotion: PromotionRecord;
};

export function PromotionCustomersTab({
  promotion,
}: PromotionCustomersTabProps) {
  const customers = promotion.shopify.customers;

  return (
    <s-stack direction="block" gap="large">
      <s-section heading="Customer eligibility">
        {customers.appliesToAllCustomers ? (
          <s-banner tone="info">
            Customer eligibility is currently treated as all
            customers.
          </s-banner>
        ) : (
          <s-paragraph>
            This promotion is limited to selected customers or
            customer segments.
          </s-paragraph>
        )}
      </s-section>

      {customers.segments.length > 0 && (
        <s-section heading="Customer segments">
          <s-stack direction="block" gap="small">
            {customers.segments.map((segment) => (
              <s-paragraph key={segment.id}>
                {segment.name}
              </s-paragraph>
            ))}
          </s-stack>
        </s-section>
      )}

      {customers.customers.length > 0 && (
        <s-section heading="Customers">
          <s-stack direction="block" gap="small">
            {customers.customers.map((customer) => (
              <s-paragraph key={customer.id}>
                {customer.name}
              </s-paragraph>
            ))}
          </s-stack>
        </s-section>
      )}

      <s-section heading="Data status">
        <s-paragraph>
          Customer selection has not yet been added to the
          Shopify GraphQL query.
        </s-paragraph>
      </s-section>
    </s-stack>
  );
}
