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
import { v4 as uuid } from "uuid";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { getPointsAsync } from "replay-next/src/suspense/PointsCache";
import { insert } from "replay-next/src/utils/array";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { POINT_BEHAVIOR_DISABLED, Point, PointBehavior, PointKey } from "shared/client/types";
import {
  addPoint as addPointGraphQL,
  deletePoint as deletePointGraphQL,
  updatePoint as updatePointGraphQL,
} from "shared/graphql/Points";

import useBreakpointIdsFromServer from "../hooks/useBreakpointIdsFromServer";
import useIndexedDB, { IDBOptions } from "../hooks/useIndexedDB";
import { SessionContext } from "./SessionContext";

export type PointBehaviorsObject = { [key: PointKey]: PointBehavior };

const EMPTY_ARRAY: Point[] = [];
const EMPTY_OBJECT: PointBehaviorsObject = {};

// NOTE: If any change is made like adding a store name, bump the version number
// to ensure that the database is recreated properly.
export const POINTS_DATABASE: IDBOptions = {
  databaseName: "Points",
  databaseVersion: 2,
  storeNames: ["high-priority", "transition"],
};
export const POINT_BEHAVIORS_DATABASE: IDBOptions = {
  databaseName: "PointBehaviors",
  databaseVersion: 1,
  storeNames: ["high-priority", "transition"],
};

export type PointInstance = {
  point: Point;
  timeStampedHitPoint: TimeStampedPoint;
  type: "PointInstance";
};

export type AddPoint = (
  partialPoint: Partial<Pick<Point, "badge" | "condition" | "content">>,
  partialPointBehavior: Partial<Omit<PointBehavior, "pointId">>,
  location: Location
) => void;
export type DeletePoints = (...pointIds: PointKey[]) => void;
export type EditPoint = (
  key: PointKey,
  partialPoint: Partial<Pick<Point, "badge" | "condition" | "content">>
) => void;
export type EditPointBehavior = (
  key: PointKey,
  pointBehavior: Partial<Omit<PointBehavior, "pointId">>
) => void;

export type PointsContextType = {
  addPoint: AddPoint;
  deletePoints: DeletePoints;
  editPoint: EditPoint;
  editPointBehavior: EditPointBehavior;
  isPending: boolean;
  pointBehaviors: PointBehaviorsObject;
  pointBehaviorsForSuspense: PointBehaviorsObject;
  points: Point[];
  pointsForSuspense: Point[];
};

export const isValidPoint = (maybePoint: unknown): maybePoint is Point => {
  return (
    typeof maybePoint === "object" &&
    maybePoint !== null &&
    maybePoint.hasOwnProperty("badge") &&
    maybePoint.hasOwnProperty("condition") &&
    maybePoint.hasOwnProperty("content")
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

  const { setValue: setPointBehaviors, value: pointBehaviors } = useIndexedDB<PointBehaviorsObject>(
    {
      database: POINT_BEHAVIORS_DATABASE,
      initialValue: EMPTY_OBJECT,
      recordName: recordingId,
      storeName: "high-priority",
    }
  );

  // Note that we fetch using the async helper rather than Suspense,
  // because it's better to load the rest of the app earlier than to wait on Points.
  const [remotePoints, setRemotePoints] = useState<Point[] | null>(null);
  useEffect(() => {
    async function fetchPoints() {
      const points = await getPointsAsync(graphQLClient, accessToken, recordingId);
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
      if (currentUserId && currentUserId === point.user?.id) {
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
  const pointBehaviorsForSuspense = useDeferredValue(pointBehaviors);
  const isPending =
    mergedPoints !== pointsForSuspense || pointBehaviors !== pointBehaviorsForSuspense;

  // Track the latest committed values for e.g. the editPoint function.
  const committedValuesRef = useRef<{
    points: Point[];
    pointBehaviors: PointBehaviorsObject;
  }>({ points: EMPTY_ARRAY, pointBehaviors: EMPTY_OBJECT });
  useEffect(() => {
    committedValuesRef.current.pointBehaviors = pointBehaviors;
    committedValuesRef.current.points = mergedPoints;
  });

  const addPoint = useCallback<AddPoint>(
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
        shouldBreak: POINT_BEHAVIOR_DISABLED,
        shouldLog: POINT_BEHAVIOR_DISABLED,
        ...partialPointBehavior,
      };

      setLocalPoints((prevPoints: Point[]) => {
        const index = sortedIndexBy(prevPoints, point, ({ location }) => location.line);
        return prevPoints.slice(0, index).concat([point], prevPoints.slice(index));
      });
      setPointBehaviors(prev => {
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
      setPointBehaviors,
      trackEvent,
    ]
  );

  const deletePoints = useCallback<DeletePoints>(
    (...keys: PointKey[]) => {
      trackEvent("breakpoint.remove");

      setLocalPoints((prevPoints: Point[]) =>
        prevPoints.filter(point => !keys.includes(point.key))
      );
      setPointBehaviors(prev => {
        const cloned = { ...prev };
        keys.forEach(key => {
          delete cloned[key];
        });
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
      }
    },

    [accessToken, graphQLClient, setLocalPoints, setPointBehaviors, trackEvent]
  );

  const editPoint = useCallback<EditPoint>(
    (key: PointKey, partialPoint: Partial<Pick<Point, "badge" | "condition" | "content">>) => {
      trackEvent("breakpoint.edit");

      const { points } = committedValuesRef.current;
      const prevPoint = points.find(point => point.key === key);
      if (prevPoint) {
        const newPoint: Point = {
          ...prevPoint,
          ...partialPoint,
        };

        setLocalPoints((prevPoints: Point[]) => {
          const index = prevPoints.findIndex(point => point.key === key);
          if (index >= 0) {
            const points = prevPoints.slice();
            points.splice(index, 1, newPoint);
            return points;
          }

          throw Error(`Could not find point with key "${key}"`);
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

  const editPointBehavior = useCallback<EditPointBehavior>(
    (key: PointKey, pointBehavior: Partial<Omit<PointBehavior, "key">>) => {
      trackEvent("breakpoint.edit");

      const { pointBehaviors } = committedValuesRef.current;
      const prevPointBehavior = pointBehaviors[key];

      setPointBehaviors(prev => {
        return {
          ...prev,
          [key]: {
            shouldBreak: prevPointBehavior?.shouldBreak ?? POINT_BEHAVIOR_DISABLED,
            shouldLog: prevPointBehavior?.shouldLog ?? POINT_BEHAVIOR_DISABLED,
            ...pointBehavior,
            key,
          },
        };
      });
    },
    [setPointBehaviors, trackEvent]
  );

  useBreakpointIdsFromServer(replayClient, mergedPoints, pointBehaviors, deletePoints);

  const context = useMemo(
    () => ({
      addPoint,
      deletePoints,
      editPoint,
      editPointBehavior,
      isPending,
      pointBehaviors,
      pointBehaviorsForSuspense,
      points: mergedPoints,
      pointsForSuspense,
    }),
    [
      addPoint,
      deletePoints,
      editPoint,
      editPointBehavior,
      isPending,
      mergedPoints,
      pointBehaviors,
      pointBehaviorsForSuspense,
      pointsForSuspense,
    ]
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
    return pointA.createdAt.getTime() - pointB.createdAt.getTime();
  }
}
