import { createCache } from "suspense";

import { GetRelatedTests_node_Workspace_relatedTests_edges_node as RelatedTest } from "shared/graphql/generated/GetRelatedTests";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";

import { getRelatedTestsGraphQL } from "../graphql/RelatedTestsGraphQL";

export const relatedTestsCache = createCache<
  [graphQLClient: GraphQLClientInterface, accessToken: string | null, workspaceId: string],
  RelatedTest[]
>({
  config: { immutable: true },
  debugLabel: "relatedTestsCache",
  getKey: ([_, __, workspaceId]) => workspaceId,
  load: async ([graphQLClient, accessToken, workspaceId]) => {
    const relatedTestGraphQLResponse =
      (await getRelatedTestsGraphQL(graphQLClient, accessToken, workspaceId)) ?? [];
    return relatedTestGraphQLResponse.map(edge => edge.node);
  },
});
