import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";

import { ReactDevToolsPanel } from "./react-devtools/components/ReactDevToolsPanel";

export default function ReactDevToolsWithErrorBoundary() {
  const { point, pauseId } = useMostRecentLoadedPause() ?? {};

  return (
    <InlineErrorBoundary name="ReactDevTools" resetKey={pauseId ?? ""}>
      <ReactDevToolsPanel executionPoint={point ?? null} pauseId={pauseId ?? null} />
    </InlineErrorBoundary>
  );
}
