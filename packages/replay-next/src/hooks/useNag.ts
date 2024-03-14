import { useCallback, useContext, useLayoutEffect, useMemo, useRef } from "react";

import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
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

  const committedValuesRef = useRef<{
    accessToken: string | null;
    graphQLClient: GraphQLClientInterface;
    id: string | null;
    nag: Nag;
    refetchUser: () => void;
    shouldShow: boolean;
  }>({
    accessToken,
    graphQLClient,
    id,
    nag,
    refetchUser,
    shouldShow,
  });

  useLayoutEffect(() => {
    const current = committedValuesRef.current;
    current.accessToken = accessToken;
    current.graphQLClient = graphQLClient;
    current.id = id;
    current.nag = nag;
    current.refetchUser = refetchUser;
    current.shouldShow = shouldShow;
  });

  const stableDismiss = useCallback(() => {
    const { accessToken, graphQLClient, id, nag, refetchUser, shouldShow } =
      committedValuesRef.current;

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
  }, []);

  return [shouldShow, stableDismiss];
}
