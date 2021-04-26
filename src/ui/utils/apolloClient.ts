import { ApolloClient, InMemoryCache, NormalizedCacheObject, from, HttpLink } from "@apollo/client";
import { DocumentNode } from "graphql";
import { defer } from "protocol/utils";
import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";

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
  const retryLink = new RetryLink();
  const httpLink = createHttpLink(token, recordingId);
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      console.log(`[Apollo GraphQL error]: ${graphQLErrors}`);
    } else if (networkError) {
      console.log(`[Apollo Network error]: ${networkError}`);
    }
  });

  const options: any = {
    cache: new InMemoryCache(),
    link: from([retryLink, errorLink, httpLink]),
  };

  const apolloClient = new ApolloClient<NormalizedCacheObject>(options);
  clientWaiter.resolve(apolloClient);

  return apolloClient;
}

function createHttpLink(token: string | undefined, recordingId: string | undefined) {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (recordingId) {
    headers["x-hasura-recording-id"] = recordingId;
  }

  return new HttpLink({
    uri: "https://graphql.replay.io/v1/graphql",
    headers,
    fetch,
  });
}
