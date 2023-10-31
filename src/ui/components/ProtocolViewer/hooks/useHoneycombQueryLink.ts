import { useContext } from "react";

import { ProtocolViewerContext } from "ui/components/ProtocolViewer/components/ProtocolViewerContext";
import { useGetUserInfo } from "ui/hooks/users";

export function useHoneycombQueryLink() {
  const { requestMap, selectedRequestId } = useContext(ProtocolViewerContext);

  const { internal: isInternalUser } = useGetUserInfo();
  if (isInternalUser) {
    if (selectedRequestId !== null) {
      const request = requestMap[selectedRequestId];

      const qs = encodeURIComponent(
        JSON.stringify({
          time_range: 3600,
          granularity: 0,
          breakdowns: ["trace.trace_id", "name", "rpc.replayprotocol.command_id"],
          calculations: [{ op: "AVG", column: "duration_ms" }],
          filters: [
            { column: "name", op: "starts-with", value: "replayprotocol" },
            { column: "replay.session.id", op: "=", value: window.sessionId },
            { column: "rpc.replayprotocol.command_id", op: "=", value: request.id },
          ],
          filter_combination: "AND",
          orders: [{ op: "AVG", column: "duration_ms", order: "descending" }],
          havings: [],
          limit: 100,
        })
      );

      return `https://ui.honeycomb.io/replay/datasets/backend?query=${qs}`;
    }
  }

  return null;
}
