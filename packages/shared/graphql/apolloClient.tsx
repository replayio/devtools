import {
  ApolloClient,
  ApolloError,
  HttpLink,
  InMemoryCache,
  MutationOptions,
  NormalizedCacheObject,
  OperationVariables,
  QueryOptions,
  from,
  split,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { MockLink, MockedResponse } from "@apollo/client/testing";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
import memoizeOne from "memoize-one";

import { defer } from "protocol/utils";
import { graphqlClientIdHeader } from "shared/graphql/clientIdHeader";
import { hasApiKey, isTest } from "shared/utils/environment";

export let clientWaiter = defer<ApolloClient<NormalizedCacheObject>>();

export async function query<TData = any, TVariables = OperationVariables>(
  options: QueryOptions<TVariables, TData>
) {
  const apolloClient = await clientWaiter.promise;
  return await apolloClient.query<TData, TVariables>(options);
}

export async function mutate<TData = any, TVariables = OperationVariables>(
  options: MutationOptions<TData, TVariables>
) {
  if (isTest() && !hasApiKey()) {
    // Recordings of failed e2e tests may show the Next.js error popup triggered by a failed graphql mutation,
    // making them hard to work with, so disable mutations unless the user is authenticated.
    return;
  }
  const apolloClient = await clientWaiter.promise;
  return await apolloClient.mutate<TData, TVariables>(options);
}

export const createApolloClient = memoizeOne(function (
  token: string | undefined,
  testScope: string | null,
  onAuthError?: () => void
) {
  let previousWaiter = clientWaiter;
  clientWaiter = defer<ApolloClient<NormalizedCacheObject>>();

  clientWaiter.promise.then(previousWaiter.resolve);

  const retryLink = createRetryLink();
  const errorLink = createErrorLink(onAuthError);
  const httpLink = createHttpLink(token, testScope);

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
export function extractGraphQLError(
  error: Partial<Pick<ApolloError, "graphQLErrors" | "networkError" | "message">> | undefined
): string | undefined {
  if (!error) {
    return undefined;
  }
  const graphQLError = error.graphQLErrors?.[0] || (error.networkError as any)?.result?.errors?.[0];
  return (typeof graphQLError === "string" ? graphQLError : graphQLError?.message) || error.message;
}

export function createApolloCache() {
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

function createHttpLink(token: string | undefined, testScope: string | null) {
  const headers: Record<string, string> = {
    ...graphqlClientIdHeader(),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (testScope) {
    headers["replay-test-scope"] = testScope;
  }

  const uri = process.env.NEXT_PUBLIC_API_URL;
  const httpLink = new HttpLink({
    uri,
    headers,
    fetch,
  });

  if (typeof window === "undefined") {
    return httpLink;
  }

  const wsLink = new GraphQLWsLink(
    createClient({
      url: process.env.NEXT_PUBLIC_API_SUBSCRIPTION_URL!,
      connectionParams: { token, testScope },
    })
  );

  return split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === "OperationDefinition" && definition.operation === "subscription";
    },
    wsLink,
    httpLink
  );
}

export function createErrorLink(onAuthError?: () => void) {
  return onError(err => {
    const { graphQLErrors, networkError } = err;
    if (graphQLErrors) {
      console.error(
        "[Apollo GraphQL error]",
        err.operation.operationName,
        extractGraphQLError(err),
        graphQLErrors.length > 1 ? graphQLErrors : graphQLErrors[0]
      );

      if (onAuthError && graphQLErrors.some(e => e.extensions?.code === "UNAUTHENTICATED")) {
        onAuthError();
      }
    } else if (networkError) {
      console.warn("[Apollo Network error]", networkError);
    }
  });
}

export function createRetryLink() {
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

export function createMockLink(mocks: MockedResponse<Record<string, any>>[]) {
  return new MockLink(mocks);
}
