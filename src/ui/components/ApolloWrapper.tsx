import React, { ReactNode, useState, useEffect } from "react";
import { ApolloProvider, from } from "@apollo/client";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { isTest, isMock, waitForMockEnvironment } from "ui/utils/environment";
import useToken from "ui/utils/useToken";
import { PopupBlockedError } from "ui/components/shared/Error";
import {
  createRetryLink,
  createErrorLink,
  createMockLink,
  createApolloCache,
  clientWaiter,
  createApolloClient,
} from "ui/utils/apolloClient";

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

  return (
    <ApolloProvider client={createApolloClient(token, onAuthError)}>{children}</ApolloProvider>
  );
}
