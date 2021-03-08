import { ApolloClient, InMemoryCache, NormalizedCacheObject } from "@apollo/client";
import { HttpLink } from "apollo-link-http";
import { DocumentNode } from "graphql";
import { defer } from "protocol/utils";

const clientWaiter = defer<ApolloClient<NormalizedCacheObject>>();

export async function query({ variables = {}, query }: { variables: any; query: DocumentNode }) {
  const apolloClient = await clientWaiter.promise;
  return await apolloClient.query({ variables, query });
}

export async function mutate({
  variables = {},
  mutation,
}: {
  variables: any;
  mutation: DocumentNode;
}) {
  const apolloClient = await clientWaiter.promise;
  return await apolloClient.mutate({ variables, mutation });
}

export function createApolloClient(token: string | undefined, recordingId: string | undefined) {
  const options: any = {
    cache: new InMemoryCache(),
    link: createHttpLink(token, recordingId),
  };

  const apolloClient = new ApolloClient<NormalizedCacheObject>(options);
  clientWaiter.resolve(apolloClient);
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
