import { useContext } from "react";

import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { getClosestPointForTimeSuspense } from "replay-next/src/suspense/ExecutionPointsCache";
import { pauseEvaluationsCache, pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { extractRecordingIdFromPathname } from "shared/utils/recording";
import { ProtocolViewerContext } from "ui/components/ProtocolViewer/components/ProtocolViewerContext";
import { useGetUserInfo } from "ui/hooks/users";
import { getSessionId } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";

export function useBugReportLink() {
  const { requestMap, scope, selectedRequestId } = useContext(ProtocolViewerContext);
  const replayClient = useContext(ReplayClientContext);
  const { recordingId: liveRecordingId } = useContext(SessionContext);
  const liveSessionId = useAppSelector(getSessionId);
  const { pauseId } = useMostRecentLoadedPause() ?? {};

  const { internal: isInternalUser } = useGetUserInfo();
  if (isInternalUser) {
    if (selectedRequestId !== null) {
      const request = requestMap[selectedRequestId];

      let recordingId;
      let sessionId;
      if (scope === "live") {
        sessionId = liveSessionId;
        recordingId = liveRecordingId;
      } else if (pauseId) {
        const sessionIdResponse = pauseEvaluationsCache.read(
          replayClient,
          pauseId,
          null,
          "sessionId"
        );
        const pathnameResponse = pauseEvaluationsCache.read(
          replayClient,
          pauseId,
          null,
          "window.location.pathname"
        );
        const pathname = pathnameResponse.returned?.value;

        sessionId = sessionIdResponse.returned?.value;
        recordingId = pathname
          ? extractRecordingIdFromPathname(pathnameResponse.returned?.value)
          : null;
      }

      // https://linear.app/docs/create-new-issue-urls
      const url = new URL(`https://linear.app/replay/team/BAC/new`);
      url.searchParams.set("status", "Triage");
      url.searchParams.set("title", "Protocol Command error");
      url.searchParams.set(
        "description",
        [
          `* Recording ID: ${recordingId}`,
          `* Session ID: ${sessionId}`,
          `* Command ID: ${request.id}`,
        ].join("\n")
      );

      return url.toString();
    }
  }

  return null;
}
