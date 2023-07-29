import { useContext } from "react";

import { ThreadFront } from "protocol/thread";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { ProtocolViewerContext } from "ui/components/ProtocolViewer/components/ProtocolViewerContext";
import { useGetUserInfo } from "ui/hooks/users";

export function useBugReportLink() {
  const { requestMap, selectedRequestId } = useContext(ProtocolViewerContext);
  const { recordingId } = useContext(SessionContext);

  const { internal: isInternalUser } = useGetUserInfo();
  if (isInternalUser) {
    if (selectedRequestId !== null) {
      const request = requestMap[selectedRequestId];

      // https://linear.app/docs/create-new-issue-urls
      const url = new URL(`https://linear.app/replay/team/BAC/new`);
      url.searchParams.set("status", "Triage");
      url.searchParams.set("title", "Protocol Command error");
      url.searchParams.set(
        "description",
        [
          `* Recording ID: ${recordingId}`,
          `* Session ID: ${ThreadFront.sessionId}`,
          `* Command ID: ${request.id}`,
        ].join("\n")
      );

      return url.toString();
    }
  }

  return null;
}
