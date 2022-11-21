import { useApolloClient } from "@apollo/client";
import { ReactNode, useCallback, useMemo } from "react";

import {
  SessionContext,
  SessionContextType,
} from "bvaughn-architecture-demo/src/contexts/SessionContext";
import { ThreadFront } from "protocol/thread";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserInfo } from "ui/hooks/users";
import { getRecordingDuration } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";
import { trackEventOnce } from "ui/utils/mixpanel";
import { trackEvent } from "ui/utils/telemetry";

export default function SessionContextAdapter({ children }: { children: ReactNode }) {
  const recordingId = useGetRecordingId();
  const currentUserInfo = useGetUserInfo();
  const apolloClient = useApolloClient();

  const refetchUser = useCallback(() => {
    apolloClient.refetchQueries({
      include: ["GetUser"],
    });
  }, [apolloClient]);

  const duration = useAppSelector(getRecordingDuration)!;

  const sessionContext = useMemo<SessionContextType>(
    () => ({
      accessToken: ThreadFront.getAccessToken(),
      currentUserInfo,
      duration,
      recordingId,
      sessionId: ThreadFront.sessionId!,
      refetchUser,
      // Convince TS that the function types line up, since the
      // context version just accepts `string` and not `MixPanelEvent`
      trackEvent: trackEvent as SessionContextType["trackEvent"],
      trackEventOnce: trackEventOnce as SessionContextType["trackEventOnce"],
    }),
    [currentUserInfo, duration, recordingId, refetchUser]
  );

  return <SessionContext.Provider value={sessionContext}>{children}</SessionContext.Provider>;
}
