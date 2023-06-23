import { useMemo } from "react";

import useLoadedRegions from "replay-next/src/hooks/useLoadedRegions";

const EMPTY_ARRAY = [] as any[];

export function useIndexingProgress() {
  const loadedRegions = useLoadedRegions();

  const { indexed, loading } = loadedRegions ?? {
    indexed: EMPTY_ARRAY,
    loading: EMPTY_ARRAY,
  };

  return useMemo(() => {
    let totalLoadingTime = 0;

    loading.forEach(({ begin, end }) => {
      totalLoadingTime += end.time - begin.time;
    });

    if (totalLoadingTime === 0) {
      return 0;
    }

    return 100 * (indexed.find(({ begin, end }) => end.time - begin.time > 0) ? 1 : 0);
  }, [indexed, loading]);
}
