import { ApolloProvider } from "@apollo/client";
import { ReactNode } from "react";

import { createApolloClient } from "shared/graphql/apolloClient";
import { isTest } from "shared/utils/environment";
import useToken from "ui/utils/useToken";

import { ExpectedErrorModal } from "./Errors/ExpectedErrorModal";

export function ApolloWrapper({
  children,
  onAuthError,
}: {
  children: ReactNode;
  onAuthError?: () => void;
}) {
  const { loading, token, error } = useToken();

  if (!isTest() && loading) {
    return null;
  }

  if (error) {
    if (error.message === "Could not open popup") {
      return (
        <ExpectedErrorModal
          action="refresh"
          details="In order to proceed, we need to get you to confirm your credentials. This happens in a separate pop-up window that's currently being blocked by your browser. Please disable your ad-blocker refresh this page."
          title="Please turn off your ad blocker"
        />
      );
    } else {
      return null;
    }
  }

  return (
    <ApolloProvider client={createApolloClient(token, onAuthError)}>{children}</ApolloProvider>
  );
}
