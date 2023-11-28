import { useMemo } from "react";

import useLoadedRegions from "./useLoadedRegions";

const EMPTY_ARRAY = [] as any[];

export function useIndexingProgress() {
  const loadedRegions = useLoadedRegions();

  const { indexed, loading } = loadedRegions ?? {
    indexed: EMPTY_ARRAY,
    loading: EMPTY_ARRAY,
  };

  return useMemo(() => {
    let totalTimeIndexed = 0;
    indexed.forEach(({ begin, end }) => {
      totalTimeIndexed += end.time - begin.time;
    });

    let totalTimeLoading = 0;
    loading.forEach(({ begin, end }) => {
      totalTimeLoading += end.time - begin.time;
    });

    if (totalTimeLoading === 0) {
      return 0;
    } else {
      return Math.round((100 * totalTimeIndexed) / totalTimeLoading);
    }
  }, [indexed, loading]);
}
