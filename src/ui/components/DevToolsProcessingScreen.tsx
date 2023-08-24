import { useRecordingProcessingProgress } from "replay-next/src/hooks/useRecordingProcessingProgress";
import LoadingScreen from "ui/components/shared/LoadingScreen";

export function DevToolsProcessingScreen() {
  const processingProgress = useRecordingProcessingProgress();

  return (
    <LoadingScreen
      message={
        processingProgress == null
          ? "Processing..."
          : `Processing... (${Math.round(processingProgress)}%)`
      }
    />
  );
}
