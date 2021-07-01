import React, { ReactNode } from "react";
import { DocumentNode } from "graphql";
import { defer } from "protocol/utils";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  NormalizedCacheObject,
  from,
  HttpLink,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { isTest } from "ui/utils/environment";
import useToken from "ui/utils/useToken";
import { PopupBlockedError } from "ui/components/shared/Error";
import { BlankLoadingScreen } from "ui/components/shared/BlankScreen";
import { isMock } from "ui/utils/environment";

const clientWaiter = defer<ApolloClient<NormalizedCacheObject>>();

export function ApolloWrapper({
  children,
  recordingId,
}: {
  recordingId: string | undefined;
  children: ReactNode;
}) {
  const { loading, token, error } = useToken();

  if (!isTest() && loading) {
    return null;
  }

  if (error) {
    if (error.message === "Could not open popup") {
      return <PopupBlockedError />;
    } else {
      return null;
    }
  }

  return (
    <ApolloProvider client={createApolloClient(token, recordingId)}>{children}</ApolloProvider>
  );
}

export async function query({ variables = {}, query }: { variables: any; query: DocumentNode }) {
  if (isMock()) {
    throw new Error("Apollo query during mock test");
  }

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
  if (isMock()) {
    throw new Error("Apollo mutate during mock test");
  }

  const apolloClient = await clientWaiter.promise;
  return await apolloClient.mutate({ variables, mutation });
}

export function createApolloClient(token: string | undefined, recordingId: string | undefined) {
  const retryLink = new RetryLink();
  const httpLink = createHttpLink(token, recordingId);
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      console.error("[Apollo GraphQL error]", graphQLErrors);
    } else if (networkError) {
      console.warn("[Apollo Network error]", networkError);
    }
  });

  const options: any = {
    cache: new InMemoryCache({
      typePolicies: {
        AuthenticatedUser: {
          keyFields: [],
        },
        Recording: {
          keyFields: ["uuid"],
          fields: {
            comments: {
              merge: false,
            },
          },
        },
        Comment: {
          fields: {
            replies: {
              merge: false,
            },
          },
        },
      },
    }),
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

  return new HttpLink({
    uri: "https://api.replay.io/v1/graphql",
    headers,
    fetch,
  });
}
