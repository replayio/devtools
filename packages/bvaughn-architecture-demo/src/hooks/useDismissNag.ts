import { useContext } from "react";

import { GraphQLClientContext } from "../contexts/GraphQLClientContext";
import { SessionContext } from "../contexts/SessionContext";
import { Nag } from "../graphql/types";
import { dismissNag } from "../graphql/User";

export function useDismissNag() {
  const { accessToken, currentUserInfo } = useContext(SessionContext);
  const graphQLClient = useContext(GraphQLClientContext);

  return (nag: Nag) => {
    if (!accessToken || !currentUserInfo) {
      return;
    }

    const { id, nags } = currentUserInfo;

    if (!nags || nags.includes(nag) || !id) {
      return;
    }

    dismissNag(graphQLClient, accessToken, nag);
  };
}
