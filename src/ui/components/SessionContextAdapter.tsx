import { useApolloClient } from "@apollo/client";
import { ReactNode, useCallback, useMemo } from "react";

import { ThreadFront } from "protocol/thread";
import { SessionContext, SessionContextType } from "replay-next/src/contexts/SessionContext";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserInfo } from "ui/hooks/users";
import { getPoints, getRecordingDuration } from "ui/reducers/timeline";
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

  const duration = useAppSelector(getRecordingDuration)!;
  const receivedPoints = useAppSelector(getPoints);
  const endpoint = receivedPoints[receivedPoints.length - 1];

  const sessionContext = useMemo<SessionContextType>(
    () => ({
      accessToken: apiKey || ThreadFront.getAccessToken(),
      currentUserInfo,
      duration,
      endpoint: endpoint.point,
      recordingId,
      sessionId: ThreadFront.sessionId!,
      refetchUser,
      // Convince TS that the function types line up, since the
      // context version just accepts `string` and not `MixPanelEvent`
      trackEvent: trackEvent as SessionContextType["trackEvent"],
      trackEventOnce: trackEventOnce as SessionContextType["trackEventOnce"],
    }),
    [apiKey, currentUserInfo, duration, endpoint, recordingId, refetchUser]
  );

  return <SessionContext.Provider value={sessionContext}>{children}</SessionContext.Provider>;
}
