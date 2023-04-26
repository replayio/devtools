import { useContext } from "react";
import { useStreamingValue } from "suspense";

import { useCurrentFocusPointRange } from "replay-next/src/hooks/useCurrentFocusPointRange";
import { MessageMetadata, streamingMessagesCache } from "replay-next/src/suspense/MessagesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

const EMPTY_ARRAY: any[] = [];
const EMPTY_MESSAGE_METADATA: MessageMetadata = {
  categoryCounts: {
    errors: 0,
    logs: 0,
    warnings: 0,
  },
  countAfter: 0,
  countBefore: 0,
  didOverflow: false,
};

export function useStreamingMessages() {
  const replayClient = useContext(ReplayClientContext);

  const focusPointRange = useCurrentFocusPointRange();

  const stream = streamingMessagesCache.stream(replayClient, focusPointRange);
  const { complete, data, status, value } = useStreamingValue(stream);

  return {
    complete,
    messages: value ?? EMPTY_ARRAY,
    messageMetadata: data ?? EMPTY_MESSAGE_METADATA,
    status,
  };
}
