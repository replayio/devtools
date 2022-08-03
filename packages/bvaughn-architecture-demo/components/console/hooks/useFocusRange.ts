import { isTimeInRegions } from "@bvaughn/../shared/utils/time";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import useLoadedRegions from "@bvaughn/src/hooks/useRegions";
import { getClosestPointForTime } from "@bvaughn/src/suspense/PointsCache";
import { suspendInParallel } from "@bvaughn/src/utils/suspense";
import { PointRange } from "@replayio/protocol";
import { useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

export default function useFocusRange(): PointRange | null {
  const replayClient = useContext(ReplayClientContext);
  const { range } = useContext(FocusContext);

  const loadedRegions = useLoadedRegions(replayClient);

  const focusRange = useMemo<PointRange | null>(() => {
    if (range !== null && loadedRegions !== null) {
      const [beginTime, endTime] = range;

      // TODO (FE-501) This is kind of sketchy since time is fuzzier than execution points.
      // This hook exists because we need a way to map time-to-point though, so how do we work around this?

      const isLoaded = isTimeInRegions(beginTime, loadedRegions.loaded);
      if (isLoaded) {
        // Small performance optimization:
        // Suspend in parallel when fetching points to reduce the overall wait time.
        const [beginPoint, endPoint] = suspendInParallel(
          () => getClosestPointForTime(replayClient, beginTime),
          () => getClosestPointForTime(replayClient, endTime)
        );

        return {
          begin: beginPoint,
          end: endPoint,
        };
      }
    }

    return null;
  }, [loadedRegions, range, replayClient]);

  return focusRange;
}
