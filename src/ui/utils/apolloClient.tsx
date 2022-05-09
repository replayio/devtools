import { DocumentNode } from "graphql";
import { defer } from "protocol/utils";
import { memoizeLast } from "devtools/client/debugger/src/utils/memoizeLast";
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  from,
  HttpLink,
  ApolloError,
} from "@apollo/client";
import { MockedResponse, MockLink } from "@apollo/client/testing";
import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";

export let clientWaiter = defer<ApolloClient<NormalizedCacheObject>>();

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
  let previousWaiter = clientWaiter;
  clientWaiter = defer<ApolloClient<NormalizedCacheObject>>();

  clientWaiter.promise.then(previousWaiter.resolve);

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
