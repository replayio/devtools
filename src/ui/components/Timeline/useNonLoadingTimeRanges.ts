import { useMemo } from "react";

import useLoadedRegions from "replay-next/src/hooks/useLoadedRegions";
import { getZoomRegion } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";
import { getNonLoadingRegionTimeRanges } from "ui/utils/app";

export function useNonLoadingTimeRanges() {
  const { endTime } = useAppSelector(getZoomRegion);

  const loadedRegions = useLoadedRegions();

  return useMemo(
    () => getNonLoadingRegionTimeRanges(loadedRegions?.loading ?? [], endTime),
    [loadedRegions?.loading, endTime]
  );
}
