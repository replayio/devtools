import { useApolloClient } from "@apollo/client";
import {
  SessionContext,
  SessionContextType,
} from "bvaughn-architecture-demo/src/contexts/SessionContext";
import { ThreadFront } from "protocol/thread";
import { useGetUserInfo } from "ui/hooks/users";
import { ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useGetRecordingId } from "ui/hooks/recordings";
import { getRecordingDuration } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getSourceContentsHelper } from "bvaughn-architecture-demo/src/suspense/SourcesCache";

export default function SessionContextAdapter({ children }: { children: ReactNode }) {
  const recordingId = useGetRecordingId();
  const currentUserInfo = useGetUserInfo();
  const apolloClient = useApolloClient();

  // TODO [source viewer]
  // HACK Pre-cache the source contents so we can simulate the streaming source viewer later.
  const [didPreFetchSources, setDidPreFetchSources] = useState(false);
  const client = useContext(ReplayClientContext);
  useEffect(() => {
    async function load() {
      const sources = await client.findSources();

      await Promise.all(sources.map(source => getSourceContentsHelper(client, source.sourceId)));

      setDidPreFetchSources(true);
    }

    load();
  }, [client]);

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

  return didPreFetchSources ? (
    <SessionContext.Provider value={sessionContext}>{children}</SessionContext.Provider>
  ) : null;
}
