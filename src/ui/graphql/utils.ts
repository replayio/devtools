import { ApolloError } from "@apollo/client";

export function getBackendErrorMessage(err: ApolloError) {
  const networkError = err.networkError as any;

  // The apollo client doesn't expose the network error details via its type
  // so we're cautiously walking down the object to see if the backend threw
  // a specific error
  return networkError?.result?.errors?.[0]?.message;
}
