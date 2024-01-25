import { useApolloClient } from "@apollo/client";
import { ReactNode, useCallback, useMemo } from "react";

import { SessionContext, SessionContextType } from "replay-next/src/contexts/SessionContext";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserInfo } from "ui/hooks/users";
import { getAccessToken, getSessionId } from "ui/reducers/app";
import { getEndpoint, getRecordingDuration } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";
import { trackEventOnce } from "ui/utils/mixpanel";
import { trackEvent } from "ui/utils/telemetry";

export default function SessionContextAdapter({
  apiKey,
  children,
}: {
  apiKey: string | null;
  children: ReactNode;
}) {
  const recordingId = useGetRecordingId();
  const currentUserInfo = useGetUserInfo();
  const apolloClient = useApolloClient();

  const refetchUser = useCallback(() => {
    apolloClient.refetchQueries({
      include: ["GetUser"],
    });
  }, [apolloClient]);

  const accessToken = useAppSelector(getAccessToken);
  const sessionId = useAppSelector(getSessionId);
  const duration = useAppSelector(getRecordingDuration)!;
  const endpoint = useAppSelector(getEndpoint);

  const sessionContext = useMemo<SessionContextType>(
    () => ({
      accessToken: apiKey || accessToken,
      currentUserInfo,
      duration,
      endpoint: endpoint.point,
      recordingId,
      sessionId: sessionId!,
      refetchUser,
      // Convince TS that the function types line up, since the
      // context version just accepts `string` and not `MixPanelEvent`
      trackEvent: trackEvent as SessionContextType["trackEvent"],
      trackEventOnce: trackEventOnce as SessionContextType["trackEventOnce"],
    }),
    [accessToken, apiKey, currentUserInfo, duration, endpoint, recordingId, refetchUser, sessionId]
  );

  return <SessionContext.Provider value={sessionContext}>{children}</SessionContext.Provider>;
}
