import LoadingScreen from "ui/components/shared/LoadingScreen";
import { getProcessingProgress } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";

export function DevToolsProcessingScreen() {
  const processingProgress = useAppSelector(getProcessingProgress);

  return (
    <LoadingScreen
      message={
        processingProgress == null
          ? "Processing..."
          : `Processing... (${Math.round(processingProgress)}%)`
      }
      secondaryMessage="This could take a while, depending on the complexity and length of the replay."
    />
  );
}
