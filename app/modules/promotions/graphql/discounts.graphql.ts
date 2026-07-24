export const GET_DISCOUNTS = `#graphql
  query GetDiscounts {
    discountNodes(first: 50) {
      nodes {
        id

        events(first: 1, query: "action:create") {
          nodes {
            id
            createdAt
            message

            ... on BasicEvent {
              appTitle
              attributeToApp
              attributeToUser
            }
          }
        }

        discount {
          __typename

          ... on DiscountAutomaticBasic {
            title
            status
            summary
            startsAt
            endsAt
            discountClasses

            customerGets {
              ...CustomerGetsFields
            }

            minimumRequirement {
              ...MinimumRequirementFields
            }
          }

          ... on DiscountCodeBasic {
            title
            status
            summary
            startsAt
            endsAt
            discountClasses

            codes(first: 5) {
              nodes {
                code
              }
            }

            customerGets {
              ...CustomerGetsFields
            }

            minimumRequirement {
              ...MinimumRequirementFields
            }
          }

          ... on DiscountAutomaticBxgy {
            title
            status
            summary
            startsAt
            endsAt
            discountClasses

            customerGets {
              ...CustomerGetsFields
            }
          }

          ... on DiscountCodeBxgy {
            title
            status
            summary
            startsAt
            endsAt
            discountClasses

            codes(first: 5) {
              nodes {
                code
              }
            }

            customerGets {
              ...CustomerGetsFields
            }
          }

          ... on DiscountAutomaticFreeShipping {
            title
            status
            summary
            startsAt
            endsAt
            discountClasses

            minimumRequirement {
              ...MinimumRequirementFields
            }
          }

          ... on DiscountCodeFreeShipping {
            title
            status
            summary
            startsAt
            endsAt
            discountClasses

            codes(first: 5) {
              nodes {
                code
              }
            }

            minimumRequirement {
              ...MinimumRequirementFields
            }
          }
        }
      }
    }
  }

  fragment CustomerGetsFields on DiscountCustomerGets {
    value {
      __typename

      ... on DiscountPercentage {
        percentage
      }

      ... on DiscountAmount {
        amount {
          amount
          currencyCode
        }

        appliesOnEachItem
      }

      ... on DiscountOnQuantity {
        quantity {
          quantity
        }

        effect {
          __typename

          ... on DiscountPercentage {
            percentage
          }

          ... on DiscountAmount {
            amount {
              amount
              currencyCode
            }

            appliesOnEachItem
          }
        }
      }
    }

    items {
      __typename

      ... on AllDiscountItems {
        allItems
      }

      ... on DiscountProducts {
        products(first: 50) {
          nodes {
            id
            title
          }
        }

        productVariants(first: 50) {
          nodes {
            id
            title
          }
        }
      }

      ... on DiscountCollections {
        collections(first: 50) {
          nodes {
            id
            title
          }
        }
      }
    }
  }

  fragment MinimumRequirementFields on DiscountMinimumRequirement {
    __typename

    ... on DiscountMinimumSubtotal {
      greaterThanOrEqualToSubtotal {
        amount
        currencyCode
      }
    }

    ... on DiscountMinimumQuantity {
      greaterThanOrEqualToQuantity
    }
  }
`;