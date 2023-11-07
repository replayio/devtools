import { useContext } from "react";

import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { ProtocolViewerContext } from "ui/components/ProtocolViewer/components/ProtocolViewerContext";
import { useGetUserInfo } from "ui/hooks/users";
import { getSessionId } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";

export function useBugReportLink() {
  const { requestMap, selectedRequestId } = useContext(ProtocolViewerContext);
  const { recordingId } = useContext(SessionContext);
  const sessionId = useAppSelector(getSessionId);

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
          `* Session ID: ${sessionId}`,
          `* Command ID: ${request.id}`,
        ].join("\n")
      );

      return url.toString();
    }
  }

  return null;
}
