export const GET_COLLECTION_COVERAGE_PAGE = `#graphql
  query GetCollectionCoveragePage(
    $collectionId: ID!
    $first: Int!
    $after: String
  ) {
    collection(id: $collectionId) {
      id
      title

      products(
        first: $first
        after: $after
      ) {
        nodes {
          id
          title
          handle
          status
          vendor
          productType
          totalInventory
        }

        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;
