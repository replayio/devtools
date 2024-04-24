import { useEffect, useState } from "react";

import LoadingScreen from "ui/components/shared/LoadingScreen";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { getProcessingProgress } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";
import { formatEstimatedProcessingDuration } from "ui/utils/formatEstimatedProcessingDuration";

const SHOW_STALLED_MESSAGE_AFTER_MS = 30_000;

export function DevToolsProcessingScreen() {
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);

  const processingProgress = useAppSelector(getProcessingProgress);

  const [showStalledMessage, setShowStalledMessage] = useState(false);

  useEffect(() => {
    if (processingProgress == null) {
      const timeout = setTimeout(() => {
        setShowStalledMessage(true);
      }, SHOW_STALLED_MESSAGE_AFTER_MS);

      return () => {
        clearTimeout(timeout);
      };
    } else {
      setShowStalledMessage(false);
    }
  }, [processingProgress]);

  let message = "Processing...";
  let secondaryMessage =
    "This could take a while, depending on the complexity and length of the replay.";

  if (showStalledMessage) {
    secondaryMessage = "There may be a problem. This is taking much longer than expected.";
  } else if (recording?.duration != null) {
    const durationLabel = formatEstimatedProcessingDuration(recording?.duration);
    secondaryMessage = `Based on the length of this Replay, we expect processing will take about ${durationLabel}`;
  }

  if (processingProgress != null) {
    message = `Processing... (${Math.round(processingProgress)}%)`;
  }

  return <LoadingScreen message={message} secondaryMessage={secondaryMessage} />;
}
