import { useContext, useMemo } from "react";

import { useSources } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

export function useIsRecordingOfReplay() {
  const replayClient = useContext(ReplayClientContext);
  const sourceDetails = useSources(replayClient);

  return useMemo(() => {
    const hasKnownReplaySources = sourceDetails.some(source => {
      return (
        source.url?.includes("src/ui/setup/store.ts") ||
        source.url?.includes("src/ui/setup/dynamic/devtools.ts")
      );
    });

    return hasKnownReplaySources;
  }, [sourceDetails]);
}
