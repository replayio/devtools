import { ApolloClient, InMemoryCache, NormalizedCacheObject } from "@apollo/client";
import { HttpLink } from "apollo-link-http";
import { DocumentNode } from "graphql";
import { assert } from "protocol/utils";

let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

export function query({ variables = {}, query }: { variables: any; query: DocumentNode }) {
  assert(apolloClient);
  return apolloClient.query({ variables, query });
}

export function mutate({ variables = {}, mutation }: { variables: any; mutation: DocumentNode }) {
  assert(apolloClient);
  return apolloClient.mutate({ variables, mutation });
}

export function createApolloClient(token: string | undefined, recordingId: string | undefined) {
  const options: any = {
    cache: new InMemoryCache(),
    link: createHttpLink(token, recordingId),
  };

  apolloClient = new ApolloClient(options);
  return apolloClient;
}

function createHttpLink(token: string | undefined, recordingId: string | undefined) {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : { "x-hasura-recording-id": recordingId };

  return new HttpLink({
    uri: "https://graphql.replay.io/v1/graphql",
    headers,
    fetch,
  });
}
