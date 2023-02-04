import { Location, TimeStampedPoint } from "@replayio/protocol";
import sortedIndexBy from "lodash/sortedIndexBy";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { getPointsAsync } from "replay-next/src/suspense/PointsCache";
import { findIndex, insert } from "replay-next/src/utils/array";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { POINT_BEHAVIOR_DISABLED, Point, PointId } from "shared/client/types";
import {
  addPoint as addPointGraphQL,
  deletePoint as deletePointGraphQL,
  updatePoint as updatePointGraphQL,
} from "shared/graphql/Points";
import { UserInfo } from "shared/graphql/types";

import useBreakpointIdsFromServer from "../hooks/useBreakpointIdsFromServer";
import useIndexedDB, { IDBOptions } from "../hooks/useIndexedDB";
import { SessionContext } from "./SessionContext";

const EMPTY_ARRAY: Point[] = [];

// NOTE: If any change is made like adding a store name, bump the version number
// to ensure that the database is recreated properly.
export const POINTS_DATABASE: IDBOptions = {
  databaseName: "Points",
  databaseVersion: 1,
  storeNames: ["high-priority", "transition"],
};

export type PointInstance = {
  point: Point;
  timeStampedHitPoint: TimeStampedPoint;
  type: "PointInstance";
};

export type AddPoint = (partialPoint: Partial<Point> | null, location: Location) => void;
export type DeletePoints = (...id: PointId[]) => void;
export type EditPoint = (id: PointId, partialPoint: Partial<Point>) => void;

export type PointsContextType = {
  addPoint: AddPoint;
  deletePoints: DeletePoints;
  editPoint: EditPoint;
  isPending: boolean;
  points: Point[];
  pointsForSuspense: Point[];
};

export const isValidPoint = (maybePoint: unknown): maybePoint is Point => {
  return (
    typeof maybePoint === "object" &&
    typeof (maybePoint as Point)?.createdAtTime === "number" &&
    typeof (maybePoint as Point)?.id === "string" &&
    typeof (maybePoint as Point)?.location === "object"
  );
};

export const PointsContext = createContext<PointsContextType>(null as any);

export function PointsContextRoot({ children }: PropsWithChildren<{}>) {
  const graphQLClient = useContext(GraphQLClientContext);
  const { accessToken, currentUserInfo, recordingId, trackEvent } = useContext(SessionContext);
  const replayClient = useContext(ReplayClientContext);

  const { setValue: setLocalPoints, value: localPoints } = useIndexedDB<Point[]>({
    database: POINTS_DATABASE,
    initialValue: EMPTY_ARRAY,
    recordName: recordingId,
    storeName: "high-priority",
  });

  // Note that we fetch using the async helper rather than Suspense,
  // because it's better to load the rest of the app earlier than to wait on Points.
  const [remotePoints, setRemotePoints] = useState<Point[] | null>(null);
  useEffect(() => {
    async function fetchPoints() {
      const points = await getPointsAsync(graphQLClient, recordingId, accessToken);
      setRemotePoints(points);
    }

    fetchPoints();
  }, [graphQLClient, recordingId, accessToken]);

  // Merge points from IndexedDB and GraphQL.
  // Current user points may exist in both places, so for simplicity we only include the local version.
  // This has an added benefit of ensuring edits/deletions always reflect the latest state
  // without requiring refetching data from GraphQL.
  const mergedPoints = useMemo<Point[]>(() => {
    const currentUserId = currentUserInfo?.id ?? null;

    const mergedPoints: Point[] = [];
    localPoints?.forEach(point => {
      insert<Point>(mergedPoints, point, comparePoints);
    });
    remotePoints?.forEach(point => {
      if (currentUserId && currentUserId === point.createdByUserId) {
        return;
      }

      insert<Point>(mergedPoints, point, comparePoints);
    });
    return mergedPoints;
  }, [currentUserInfo, localPoints, remotePoints]);

  // We also store a separate copy of points so that e.g. if the Console suspends to fetch remote values
  // it won't prevent the log point editor UI from updating in response to user input.
  // These get updated at a lower, transition priority.
  const pointsForSuspense = useDeferredValue<Point[]>(mergedPoints);
  const isPending = mergedPoints !== pointsForSuspense;

  // Track the latest committed values for e.g. the editPoint function.
  const committedPointsRef = useRef<Point[]>(mergedPoints);
  useEffect(() => {
    committedPointsRef.current = mergedPoints;
  });

  const addPoint = useCallback(
    (partialPoint: Partial<Point> | null, location: Location) => {
      // TODO Determine if we should track "breakpoint.add_column" here
      trackEvent("breakpoint.add");

      // Points (and their ids) are shared between tabs (via IndexedDB),
      // so the id numbers should be deterministic;
      // a single incrementing counter wouldn't work well unless it was also synced.
      const id = createPointId(currentUserInfo, location);

      const point: Point = {
        badge: null,
        content: "",
        condition: null,
        createdByUserId: currentUserInfo?.id ?? null,
        createdAtTime: Date.now(),
        recordingId,
        shouldBreak: POINT_BEHAVIOR_DISABLED,
        shouldLog: POINT_BEHAVIOR_DISABLED,
        ...partialPoint,
        id,
        location,
      };

      setLocalPoints((prevPoints: Point[]) => {
        const index = sortedIndexBy(prevPoints, point, ({ location }) => location.line);
        return prevPoints.slice(0, index).concat([point], prevPoints.slice(index));
      });

      // If the current user is signed-in, sync this new point to GraphQL
      // to be shared with other users who can view this recording.
      if (accessToken) {
        addPointGraphQL(graphQLClient, accessToken, point).then(id => {
          console.log("addPointGraphQL ->", id);
        });
      }
    },
    [accessToken, currentUserInfo, graphQLClient, recordingId, setLocalPoints, trackEvent]
  );

  const deletePoints = useCallback(
    (...ids: PointId[]) => {
      trackEvent("breakpoint.remove");

      setLocalPoints((prevPoints: Point[]) => prevPoints.filter(point => !ids.includes(point.id)));

      // If the current user is signed-in, also delete this point from GraphQL.
      if (accessToken) {
        ids.forEach(id => deletePointGraphQL(graphQLClient, accessToken, id));
      }
    },

    [accessToken, graphQLClient, setLocalPoints, trackEvent]
  );

  const editPoint = useCallback(
    (id: PointId, partialPoint: Partial<Point>) => {
      trackEvent("breakpoint.edit");

      const committedPoints = committedPointsRef.current;
      const prevPoint = committedPoints.find(point => point.id === id);
      if (prevPoint) {
        const newPoint: Point = {
          ...prevPoint,
          ...partialPoint,
        };

        setLocalPoints((prevPoints: Point[]) => {
          const index = prevPoints.findIndex(point => point.id === id);
          if (index >= 0) {
            const points = prevPoints.slice();
            points.splice(index, 1, newPoint);
            return points;
          }

          throw Error(`Could not find point with id "${id}"`);
        });

        // If the current user is signed-in, sync this new edit to GraphQL
        // to be shared with other users who can view this recording.
        if (accessToken) {
          updatePointGraphQL(graphQLClient, accessToken, newPoint);
        }
      }
    },
    [accessToken, graphQLClient, setLocalPoints, trackEvent]
  );

  useBreakpointIdsFromServer(replayClient, mergedPoints, deletePoints);

  const context = useMemo(
    () => ({
      addPoint,
      deletePoints,
      editPoint,
      isPending,
      points: mergedPoints,
      pointsForSuspense: pointsForSuspense,
    }),
    [addPoint, deletePoints, editPoint, isPending, mergedPoints, pointsForSuspense]
  );

  return <PointsContext.Provider value={context}>{children}</PointsContext.Provider>;
}

function comparePoints(pointA: Point, pointB: Point): number {
  const locationA = pointA.location;
  const locationB = pointB.location;

  if (locationA.sourceId !== locationB.sourceId) {
    return locationA.sourceId.localeCompare(locationB.sourceId);
  } else if (locationA.line !== locationB.line) {
    return locationA.line - locationB.line;
  } else if (locationA.column !== locationB.column) {
    return locationA.column - locationB.column;
  } else {
    return pointA.createdAtTime - pointB.createdAtTime;
  }
}

function createPointId(userInfo: UserInfo | null, location: Location): string {
  const locationKey = `${location.sourceId}:${location.line}:${location.column}`;
  return userInfo ? `${userInfo.id}:${locationKey}` : locationKey;
}
