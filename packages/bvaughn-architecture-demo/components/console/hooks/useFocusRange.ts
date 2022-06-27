import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { getClosestPointForTime } from "@bvaughn/src/suspense/PointsCache";
import { suspendInParallel } from "@bvaughn/src/utils/suspense";
import { TimeStampedPointRange } from "@replayio/protocol";
import { useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

export default function useFocusRange(): TimeStampedPointRange | null {
  const replayClient = useContext(ReplayClientContext);
  const { range } = useContext(FocusContext);

  const focusRange = useMemo<TimeStampedPointRange | null>(() => {
    if (range !== null) {
      const [beginTime, endTime] = range;

      // Small performance optimization:
      // Suspend in parallel when fetching points to reduce the overall wait time.
      const [beginPoint, endPoint] = suspendInParallel(
        () => getClosestPointForTime(replayClient, beginTime),
        () => getClosestPointForTime(replayClient, endTime)
      );

      return {
        begin: {
          point: beginPoint,
          time: beginTime,
        },
        end: {
          point: endPoint,
          time: endTime,
        },
      };
    }

    return null;
  }, [range, replayClient]);

  return focusRange;
}
