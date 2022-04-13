import React, { ReactNode, useState, useEffect, useRef } from "react";
import { DocumentNode } from "graphql";
import { defer } from "protocol/utils";
import { memoizeLast } from "devtools/client/debugger/src/utils/memoizeLast";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  NormalizedCacheObject,
  from,
  HttpLink,
  ApolloError,
} from "@apollo/client";
import { MockedProvider, MockedResponse, MockLink } from "@apollo/client/testing";
import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { isTest, isMock, waitForMockEnvironment } from "ui/utils/environment";
import useToken from "ui/utils/useToken";
import { PopupBlockedError } from "ui/components/shared/Error";

const clientWaiter = defer<ApolloClient<NormalizedCacheObject>>();

export function ApolloWrapper({
  children,
  onAuthError,
}: {
  children: ReactNode;
  onAuthError?: () => void;
}) {
  const { loading, token, error } = useToken();
  const clientRef = useRef(createApolloClient(token, onAuthError));

  const [mocks, setMocks] = useState<MockedResponse<Record<string, any>>[]>();

  useEffect(() => {
    async function waitForMocks() {
      const mockEnvironment = await waitForMockEnvironment();
      setMocks(mockEnvironment!.graphqlMocks);
    }
    if (isMock()) {
      waitForMocks();
    }
  }, []);

  if (isMock()) {
    if (!mocks) {
      return null;
    }

    const retryLink = createRetryLink();
    const errorLink = createErrorLink(onAuthError);
    const mockLink = createMockLink(mocks);

    return (
      <MockedProvider
        link={from([retryLink, errorLink, mockLink])}
        cache={createApolloCache()}
        ref={mockRef => mockRef && clientWaiter.resolve(mockRef!.state.client)}
      >
        <>{children}</>
      </MockedProvider>
    );
  }

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

  return <ApolloProvider client={clientRef.current}>{children}</ApolloProvider>;
}

export async function query({ variables = {}, query }: { variables: any; query: DocumentNode }) {
  const apolloClient = await clientWaiter.promise;
  return await apolloClient.query({ variables, query });
}

export async function mutate({
  variables = {},
  mutation,
  refetchQueries,
}: {
  variables: any;
  mutation: DocumentNode;
  refetchQueries?: any;
}) {
  const apolloClient = await clientWaiter.promise;
  return await apolloClient.mutate({ variables, mutation, refetchQueries });
}

export const createApolloClient = memoizeLast(function (
  token: string | undefined,
  onAuthError?: () => void
) {
  const retryLink = createRetryLink();
  const errorLink = createErrorLink(onAuthError);
  const httpLink = createHttpLink(token);

  const options: any = {
    cache: createApolloCache(),
    link: from([retryLink, errorLink, httpLink]),
  };

  const apolloClient = new ApolloClient<NormalizedCacheObject>(options);
  clientWaiter.resolve(apolloClient);

  return apolloClient;
});

/**
 * Check if the given ApolloError is a GraphQL error (and not a network error)
 * and extract the GraphQL error message.
 * Apollo's error reporting is inconsistent and GraphQL errors may appear as
 * network errors containing the GraphQL error in an undocumented property.
 */
export function extractGraphQLError(error: ApolloError | undefined): string | undefined {
  if (!error) {
    return undefined;
  }
  const graphQLError = error.graphQLErrors?.[0] || (error.networkError as any)?.result?.errors?.[0];
  return (typeof graphQLError === "string" ? graphQLError : graphQLError?.message) || error.message;
}

function createApolloCache() {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          viewer: {
            merge: true,
          },
        },
      },
      AuthenticatedUser: {
        merge: true,
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
  });
}

function createHttpLink(token: string | undefined) {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const uri = process.env.NEXT_PUBLIC_API_URL;
  return new HttpLink({
    uri,
    headers,
    fetch,
  });
}

function createErrorLink(onAuthError?: () => void) {
  return onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      console.error("[Apollo GraphQL error]", graphQLErrors);

      if (onAuthError && graphQLErrors.some(e => e.extensions?.code === "UNAUTHENTICATED")) {
        onAuthError();
      }
    } else if (networkError) {
      console.warn("[Apollo Network error]", networkError);
    }
  });
}

function createRetryLink() {
  return new RetryLink({
    attempts: {
      retryIf: error => {
        // GraphQL errors appear in error?.result?.errors.
        // We don't want to retry requests that failed due to GraphQL errors.
        return !error?.result?.errors?.length;
      },
    },
  });
}

function createMockLink(mocks: MockedResponse<Record<string, any>>[]) {
  return new MockLink(mocks);
}
