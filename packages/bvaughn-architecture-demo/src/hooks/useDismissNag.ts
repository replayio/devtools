import { useContext } from "react";

import { GraphQLClientContext } from "../contexts/GraphQLClientContext";
import { SessionContext } from "../contexts/SessionContext";
import { Nag } from "../graphql/types";
import { dismissNag } from "../graphql/User";

export function useDismissNag() {
  const { accessToken, currentUserInfo, refetchUser } = useContext(SessionContext);
  const graphQLClient = useContext(GraphQLClientContext);

  return async (nag: Nag) => {
    if (!accessToken || !currentUserInfo) {
      return;
    }

    const { id, nags } = currentUserInfo;

    if (!nags || nags.includes(nag) || !id) {
      return;
    }

    await dismissNag(graphQLClient, accessToken, nag);
    // The console uses a simple `fetch`-based GraphQL client.
    // But, our user data  in the main app is stored via Apollo.
    // Apollo won't refetch automatically when we made this update,
    // so run this callback to force Apollo to refetch the user.
    refetchUser();
  };
}
