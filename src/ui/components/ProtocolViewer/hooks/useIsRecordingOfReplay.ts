import { useMemo } from "react";

import { getAllSourceDetails } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

export function useIsRecordingOfReplay() {
  const sourceDetails = useAppSelector(getAllSourceDetails);

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
