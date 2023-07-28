import { RequestSummaryChunk } from "ui/components/ProtocolViewer/types";
import { RequestSummary } from "ui/reducers/protocolMessages";

// Collapses consecutive requests with the same method name and shows the count.
export function flattenRequests(requestMap: {
  [key: number]: RequestSummary;
}): RequestSummaryChunk[] {
  const flattened: RequestSummaryChunk[] = [];
  let current: RequestSummaryChunk | null = null;

  for (let id in requestMap) {
    const request = requestMap[id];

    if (current == null || current.class !== request.class || current.method !== request.method) {
      current = {
        class: request.class,
        count: 1,
        errored: request.errored,
        ids: [request.id],
        method: request.method,
        pending: request.pending,
        startedAt: request.recordedAt,
      };

      flattened.push(current);
    } else {
      current.count++;
      current.errored ||= request.errored;
      current.pending ||= request.pending;
      current.ids.push(request.id);
    }
  }

  return flattened;
}
