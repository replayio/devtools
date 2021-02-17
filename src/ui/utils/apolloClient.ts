import { ApolloClient, InMemoryCache, NormalizedCacheObject } from "@apollo/client";
import { HttpLink } from "apollo-link-http";
import { DocumentNode } from "graphql";
import { assert } from "protocol/utils";
import { getTest } from "ui/utils/environment";

let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

export function query({ variables = {}, query }: { variables: any; query: DocumentNode }) {
  if (!getTest()) {
    return null;
  }
  assert(apolloClient);
  return apolloClient.query({ variables, query });
}

export function mutate({ variables = {}, mutation }: { variables: any; mutation: DocumentNode }) {
  assert(apolloClient);
  return apolloClient.mutate({ variables, mutation });
}

export function createApolloClient(token: string | undefined) {
  const options: any = !token
    ? {
        cache: new InMemoryCache(),
        uri: "https://graphql.replay.io/v1/graphql",
      }
    : {
        cache: new InMemoryCache(),
        link: createHttpLink(token),
      };

  apolloClient = new ApolloClient(options);
  return apolloClient;
}

function createHttpLink(token: string) {
  return new HttpLink({
    uri: "https://graphql.replay.io/v1/graphql",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    fetch,
  });
}
