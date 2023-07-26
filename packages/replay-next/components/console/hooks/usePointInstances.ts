import { TimeStampedPointRange } from "@replayio/protocol";
import { useContext, useEffect, useMemo, useSyncExternalStore } from "react";

import { PointBehaviorsObject, PointInstance } from "replay-next/src/contexts/points/types";
import { hitPointsForLocationCache } from "replay-next/src/suspense/HitPointsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { POINT_BEHAVIOR_ENABLED, Point, ReplayClientInterface } from "shared/client/types";
import { toPointRange } from "shared/utils/time";

const EMPTY_ARRAY: PointInstance[] = [];

// Transform Points (source location) to PointInstances (hit points / execution points for the source location)
// Each Point maps to zero or more hit points
//
// This information needs to be
export function usePointInstances({
  focusRange,
  pointBehaviors,
  points,
}: {
  focusRange: TimeStampedPointRange | null;
  pointBehaviors: PointBehaviorsObject;
  points: Point[];
}): PointInstance[] {
  const client = useContext(ReplayClientContext);

  // Unique value to re-run memoization when new hit points have been loaded
  const memoizationToken = useSyncExternalStore(
    callback => {
      const unsubscribeCallbacks: Function[] = [];
      if (focusRange !== null) {
        points.forEach(point => {
          const pointBehavior = pointBehaviors[point.key];
          if (pointBehavior?.shouldLog === POINT_BEHAVIOR_ENABLED) {
            unsubscribeCallbacks.push(
              hitPointsForLocationCache.subscribe(
                callback,
                client,
                toPointRange(focusRange),
                point.location,
                point.condition
              )
            );
          }
        });
      }

      return () => {
        unsubscribeCallbacks.forEach(callback => callback());
      };
    },
    () =>
      getMemoizationToken({
        client,
        focusRange,
        pointBehaviors,
        points,
      }),
    () =>
      getMemoizationToken({
        client,
        focusRange,
        pointBehaviors,
        points,
      })
  );

  // Lazily fetch any hit points that weren't already fetched yet
  // useSyncExternalStore will ensure this component re-renders once values have loaded
  useEffect(() => {
    if (focusRange !== null) {
      points.forEach(point => {
        hitPointsForLocationCache.readAsync(
          client,
          toPointRange(focusRange),
          point.location,
          point.condition
        );
      });
    }
  });

  return useMemo<PointInstance[]>(() => {
    const pointInstances: PointInstance[] = [];

    // Reference this so the rules-of-hooks won't complain.
    memoizationToken;

    if (focusRange == null) {
      return EMPTY_ARRAY;
    } else {
      points.forEach(point => {
        const pointBehavior = pointBehaviors[point.key];
        if (pointBehavior?.shouldLog === POINT_BEHAVIOR_ENABLED) {
          // Don't suspend here; use a cached value if there is one
          const value = hitPointsForLocationCache.getValueIfCached(
            client,
            toPointRange(focusRange),
            point.location,
            point.condition
          );
          if (value) {
            const [hitPoints, status] = value;

            switch (status) {
              case "too-many-points-to-find":
              case "too-many-points-to-run-analysis": {
                // Don't try to render log points if there are too many hits.
                break;
              }
              default: {
                hitPoints.forEach(hitPoint => {
                  pointInstances.push({
                    point,
                    timeStampedHitPoint: hitPoint,
                    type: "PointInstance",
                  });
                });
                break;
              }
            }
          }
        }
      });
    }

    return pointInstances;
  }, [client, focusRange, memoizationToken, pointBehaviors, points]);
}

function getMemoizationToken({
  client,
  focusRange,
  pointBehaviors,
  points,
}: {
  client: ReplayClientInterface;
  focusRange: TimeStampedPointRange | null;
  pointBehaviors: PointBehaviorsObject;
  points: Point[];
}) {
  const keys: string[] = [];

  if (focusRange !== null) {
    points.forEach(point => {
      const pointBehavior = pointBehaviors[point.key];
      if (pointBehavior?.shouldLog === POINT_BEHAVIOR_ENABLED) {
        const cachedValue = hitPointsForLocationCache.getValueIfCached(
          client,
          toPointRange(focusRange),
          point.location,
          point.condition
        );
        if (cachedValue != null) {
          keys.push(`${point.key}-${point.condition === null ? false : true}`);
        }
      }
    });
  }

  return keys.join();
}
