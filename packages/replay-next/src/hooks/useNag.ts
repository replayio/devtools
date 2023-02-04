import { useCallback, useContext, useMemo } from "react";

import { Nag } from "shared/graphql/types";
import { dismissNag } from "shared/graphql/User";

import { GraphQLClientContext } from "../contexts/GraphQLClientContext";
import { SessionContext } from "../contexts/SessionContext";

export function useNag(nag: Nag): [shouldShow: boolean, dismiss: () => void] {
  const { accessToken, currentUserInfo, refetchUser } = useContext(SessionContext);
  const graphQLClient = useContext(GraphQLClientContext);

  const id = currentUserInfo?.id || null;
  const nags = currentUserInfo?.nags || null;

  const shouldShow = useMemo(() => {
    return nags !== null && !nags.includes(nag);
  }, [nag, nags]);

  const dismiss = useCallback(() => {
    if (!accessToken || !id || !shouldShow) {
      return;
    }

    dismissNag(graphQLClient, accessToken, nag).then(() => {
      // The console uses a simple `fetch`-based GraphQL client.
      // But, our user data  in the main app is stored via Apollo.
      // Apollo won't refetch automatically when we made this update,
      // so run this callback to force Apollo to refetch the user.
      refetchUser();
    });
  }, [accessToken, graphQLClient, id, nag, refetchUser, shouldShow]);

  return [shouldShow, dismiss];
}
