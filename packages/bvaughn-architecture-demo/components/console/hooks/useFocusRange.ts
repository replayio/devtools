import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { getClosestPointForTime } from "@bvaughn/src/suspense/PointsCache";
import { suspendInParallel } from "@bvaughn/src/utils/suspense";
import { PointRange } from "@replayio/protocol";
import { useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

export default function useFocusRange(): PointRange | null {
  const replayClient = useContext(ReplayClientContext);
  const { range } = useContext(FocusContext);

  const focusRange = useMemo<PointRange | null>(() => {
    if (range !== null) {
      const [beginTime, endTime] = range;

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

    return null;
  }, [range, replayClient]);

  return focusRange;
}
