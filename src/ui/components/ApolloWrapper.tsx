import { ApolloProvider, from } from "@apollo/client";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import React, { ReactNode, useEffect, useState } from "react";

import {
  clientWaiter,
  createApolloCache,
  createApolloClient,
  createErrorLink,
  createMockLink,
  createRetryLink,
} from "shared/graphql/apolloClient";
import { getGraphqlMocksForTesting, isMock, isTest } from "shared/utils/environment";
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

  const [mocks, setMocks] = useState<MockedResponse<Record<string, any>>[]>();

  useEffect(() => {
    async function waitForGraphqlMocks() {
      const graphqlMocks = await getGraphqlMocksForTesting();
      setMocks(graphqlMocks);
    }

    if (isMock()) {
      waitForGraphqlMocks();
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

  return (
    <ApolloProvider client={createApolloClient(token, onAuthError)}>{children}</ApolloProvider>
  );
}
