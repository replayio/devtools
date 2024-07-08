import { Location, RecordingId } from "@replayio/protocol";
import { useCallback } from "react";
import { v4 as uuid } from "uuid";

import { TrackEvent } from "replay-next/src/contexts/SessionContext";
import { POINT_BEHAVIOR_DISABLED, Point, PointBehavior } from "shared/client/types";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { addPoint as addPointGraphQL } from "shared/graphql/Points";
import { UserInfo } from "shared/graphql/types";

import { AddPoint } from "../types";
import { SetLocalPointBehaviors } from "./useLocalPointBehaviors";
import { SetLocalPoints } from "./useLocalPoints";

export default function useAddPoint({
  accessToken,
  currentUserInfo,
  graphQLClient,
  recordingId,
  setLocalPoints,
  setLocalPointBehaviors,
  trackEvent,
}: {
  accessToken: string | null;
  currentUserInfo: UserInfo | null;
  graphQLClient: GraphQLClientInterface;
  recordingId: RecordingId;
  setLocalPoints: SetLocalPoints;
  setLocalPointBehaviors: SetLocalPointBehaviors;
  trackEvent: TrackEvent;
}): AddPoint {
  return useCallback<AddPoint>(
    (
      partialPoint: Partial<Pick<Point, "badge" | "condition" | "content">>,
      partialPointBehavior: Partial<Omit<PointBehavior, "pointId">>,
      location: Location
    ) => {
      // TODO Determine if we should track "breakpoint.add_column" here
      trackEvent("breakpoint.add");

      // Points (and their ids) are shared between tabs (via IndexedDB),
      // so the id numbers should be deterministic;
      // a single incrementing counter wouldn't work well unless it was also synced.
      const key = uuid();

      const point: Point = {
        badge: null,
        condition: null,
        content: "",
        createdAt: new Date(),
        key,
        recordingId,
        location,
        user: currentUserInfo,
        ...partialPoint,
      };

      const pointBehavior: PointBehavior = {
        key,
        shouldLog: POINT_BEHAVIOR_DISABLED,
        ...partialPointBehavior,
      };

      setLocalPoints(prev => {
        const cloned = { ...prev };
        cloned[key] = point;
        return cloned;
      });

      setLocalPointBehaviors(prev => {
        return {
          ...prev,
          [key]: pointBehavior,
        };
      });

      // If the current user is signed-in, sync this new point to GraphQL
      // to be shared with other users who can view this recording.
      if (accessToken) {
        addPointGraphQL(graphQLClient, accessToken, point);
      }
    },
    [
      accessToken,
      currentUserInfo,
      graphQLClient,
      recordingId,
      setLocalPoints,
      setLocalPointBehaviors,
      trackEvent,
    ]
  );
}
