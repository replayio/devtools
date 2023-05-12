import { Dispatch, SetStateAction, useCallback } from "react";

import { TrackEvent } from "replay-next/src/contexts/SessionContext";
import { Point, PointKey } from "shared/client/types";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { deletePoint as deletePointGraphQL } from "shared/graphql/Points";

import { CommittedValuesRef } from "../PointsContext";
import { DeletePoints } from "../types";
import { SetLocalPointBehaviors } from "./useLocalPointBehaviors";
import { SetLocalPoints } from "./useLocalPoints";

export default function useDeletePoints({
  accessToken,
  committedValuesRef,
  graphQLClient,
  setLocalPoints,
  setLocalPointBehaviors,
  setPendingPoints,
  setRemotePoints,
  trackEvent,
}: {
  accessToken: string | null;
  committedValuesRef: CommittedValuesRef;
  graphQLClient: GraphQLClientInterface;
  setLocalPoints: SetLocalPoints;
  setLocalPointBehaviors: SetLocalPointBehaviors;
  setPendingPoints: Dispatch<SetStateAction<Map<PointKey, Pick<Point, "condition" | "content">>>>;
  setRemotePoints: Dispatch<SetStateAction<Point[]>>;
  trackEvent: TrackEvent;
}): DeletePoints {
  return useCallback<DeletePoints>(
    (...keys: PointKey[]) => {
      trackEvent("breakpoint.remove");

      // Delete Points from IndexedDB
      setLocalPoints(prev => {
        const cloned = { ...prev };
        keys.forEach(key => {
          delete cloned[key];
        });
        return cloned;
      });

      // Delete associated behaviors from IndexedDB as well
      setLocalPointBehaviors(prev => {
        const cloned = { ...prev };
        keys.forEach(key => {
          delete cloned[key];
        });
        return cloned;
      });

      // Delete pending point text edits
      setPendingPoints(prev => {
        const cloned = new Map(prev.entries());
        keys.forEach(key => cloned.delete(key));
        return cloned;
      });

      // If the current user is signed-in, also delete this point from GraphQL.
      if (accessToken) {
        const { points } = committedValuesRef.current;
        keys.forEach(key => {
          const prevPoint = points.find(point => point.key === key);
          if (prevPoint) {
            deletePointGraphQL(graphQLClient, accessToken, prevPoint);
          }
        });

        // GraphQL is currently only loaded during initialization.
        // To prevent Points from being left behind in memory, also remove them from local state.
        setRemotePoints(prev => {
          const cloned = [...prev];
          keys.forEach(key => {
            const index = cloned.findIndex(point => point.key === key);
            if (index >= 0) {
              cloned.splice(index, 1);
            }
          });
          return cloned;
        });
      }
    },

    [
      accessToken,
      committedValuesRef,
      graphQLClient,
      setLocalPoints,
      setLocalPointBehaviors,
      setPendingPoints,
      setRemotePoints,
      trackEvent,
    ]
  );
}
