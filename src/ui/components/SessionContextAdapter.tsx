import { useApolloClient } from "@apollo/client";
import { ReactNode, useMemo } from "react";

import {
  SessionContext,
  SessionContextType,
} from "bvaughn-architecture-demo/src/contexts/SessionContext";
import { ThreadFront } from "protocol/thread";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserInfo } from "ui/hooks/users";
import { getRecordingDuration } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

export default function SessionContextAdapter({ children }: { children: ReactNode }) {
  const recordingId = useGetRecordingId();
  const currentUserInfo = useGetUserInfo();
  const apolloClient = useApolloClient();

  const duration = useAppSelector(getRecordingDuration)!;

  const sessionContext = useMemo<SessionContextType>(
    () => ({
      accessToken: ThreadFront.getAccessToken(),
      currentUserInfo,
      duration,
      recordingId,
      sessionId: ThreadFront.sessionId!,
      refetchUser: () => {
        // Force Apollo to refetch the user data on demand,
        // such as dismissing a nag from the console.
        apolloClient.refetchQueries({
          include: ["GetUser"],
        });
      },
      // Convince TS that the function types line up, since the
      // context version just accepts `string` and not `MixPanelEvent`
      trackEvent: trackEvent as SessionContextType["trackEvent"],
    }),
    [currentUserInfo, duration, recordingId, apolloClient]
  );

  return <SessionContext.Provider value={sessionContext}>{children}</SessionContext.Provider>;
}
