import { useRecordingProcessingProgress } from "replay-next/src/hooks/useRecordingProcessingProgress";
import { Recording } from "shared/graphql/types";

// This hook returns true if the recording is fully processed,
// false if it is still processing,
// and null if we don't know yet (because we haven't received enough data)
export function useIsRecordingProcessed(recording: Recording | undefined) {
  const { isProcessed } = recording ?? {};

  const processingProgress = useRecordingProcessingProgress();

  // If we have an explicit signal from GraphQL, we don't need to wait on the first progress event
  if (isProcessed === true) {
    return true;
  }

  // Wait until we have a signal one way or another about whether this is still processing
  if (isProcessed == null && processingProgress == null) {
    return null;
  }

  // Use GraphQL as an early signal if we haven't received the first progress event yet
  // (Sometimes there is a noticeable delay before the first processing progress event is received)
  // Ignore GraphQL once we've received the first progress event though,
  // because GraphQL updates will lag behind in-memory controller processed state
  if (processingProgress == null) {
    return isProcessed !== false;
  } else {
    return processingProgress === 100;
  }
}
