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

          minimumRequirement {
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

          minimumRequirement {
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
        }

        ... on DiscountAutomaticBxgy {
          title
          status
          summary
          startsAt
          endsAt
          discountClasses

          customerGets {
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
        }
      }
    }
  }
`;
