export const GET_DISCOUNT = `#graphql
  query GetDiscount($id: ID!) {
    discountNode(id: $id) {
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
          appliesOnOneTimePurchase
          appliesOnSubscription

          maximumShippingPrice {
            amount
            currencyCode
          }

          destinationSelection {
            __typename

            ... on DiscountCountryAll {
              allCountries
            }

            ... on DiscountCountries {
              countries
            }
          }

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
          appliesOnOneTimePurchase
          appliesOnSubscription

          codes(first: 5) {
            nodes {
              code
            }
          }

          maximumShippingPrice {
            amount
            currencyCode
          }

          destinationSelection {
            __typename

            ... on DiscountCountryAll {
              allCountries
            }

            ... on DiscountCountries {
              countries
            }
          }

          minimumRequirement {
            ...MinimumRequirementFields
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