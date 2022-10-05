import { ReactNode, useMemo } from "react";
import { getRecordingDuration } from "ui/reducers/timeline";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useAppSelector } from "ui/setup/hooks";
import {
  SessionContext,
  SessionContextType,
} from "bvaughn-architecture-demo/src/contexts/SessionContext";
import { ThreadFront } from "protocol/thread";
import { useGetUserInfo } from "ui/hooks/users";

export default function SessionContextAdapter({ children }: { children: ReactNode }) {
  const recordingId = useGetRecordingId();
  const currentUserInfo = useGetUserInfo();

  const duration = useAppSelector(getRecordingDuration)!;

  const sessionContext = useMemo<SessionContextType>(
    () => ({
      accessToken: ThreadFront.getAccessToken(),
      recordingId,
      sessionId: ThreadFront.sessionId!,
      // Duration info is primarily used by the focus editor (not imported yet)
      // but Console message context menu also allows refining the focus, which uses it.
      duration,
      currentUserInfo,
    }),
    [currentUserInfo, duration, recordingId]
  );

  return <SessionContext.Provider value={sessionContext}>{children}</SessionContext.Provider>;
}
