import { ApolloProvider } from "@apollo/client";
import { ReactNode } from "react";

import { createApolloClient } from "shared/graphql/apolloClient";
import { isTest } from "shared/utils/environment";
import { PopupBlockedError } from "ui/components/shared/Error";
import useToken from "ui/utils/useToken";

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
      return <PopupBlockedError />;
    } else {
      return null;
    }
  }

  return (
    <ApolloProvider client={createApolloClient(token, onAuthError)}>{children}</ApolloProvider>
  );
}
