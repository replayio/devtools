import { useApolloClient } from "@apollo/client";
import {
  SessionContext,
  SessionContextType,
} from "bvaughn-architecture-demo/src/contexts/SessionContext";
import { ThreadFront } from "protocol/thread";
import { useGetUserInfo } from "ui/hooks/users";
import { ReactNode, useMemo } from "react";
import { useGetRecordingId } from "ui/hooks/recordings";
import { getRecordingDuration } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

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
    }),
    [currentUserInfo, duration, recordingId, apolloClient]
  );

  return <SessionContext.Provider value={sessionContext}>{children}</SessionContext.Provider>;
}
