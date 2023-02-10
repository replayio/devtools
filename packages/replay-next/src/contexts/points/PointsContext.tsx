import { Location, TimeStampedPoint } from "@replayio/protocol";
import sortedIndexBy from "lodash/sortedIndexBy";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { v4 as uuid } from "uuid";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { EMPTY_ARRAY, EMPTY_OBJECT } from "replay-next/src/contexts/points/constants";
import { getPointsAsync } from "replay-next/src/suspense/PointsCache";
import { findIndex, insert } from "replay-next/src/utils/array";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  Badge,
  POINT_BEHAVIOR_DISABLED,
  Point,
  PointBehavior,
  PointKey,
} from "shared/client/types";
import {
  addPoint as addPointGraphQL,
  deletePoint as deletePointGraphQL,
  updatePoint as updatePointGraphQL,
} from "shared/graphql/Points";

import useBreakpointIdsFromServer from "../../hooks/useBreakpointIdsFromServer";
import useIndexedDB, { IDBOptions } from "../../hooks/useIndexedDB";
import { SessionContext } from "../SessionContext";
import comparePoints from "./comparePoints";
import {
  AddPoint,
  DeletePoints,
  EditPointBadge,
  EditPointBehavior,
  EditPointDangerousToUseDirectly,
  PointBehaviorsObject,
} from "./types";

// NOTE: If any change is made like adding a store name, bump the version number
// to ensure that the database is recreated properly.
export const POINTS_DATABASE: IDBOptions = {
  databaseName: "Points",
  databaseVersion: 2,
  storeNames: ["points", "point-behaviors"],
};

export type PointInstance = {
  point: Point;
  timeStampedHitPoint: TimeStampedPoint;
  type: "PointInstance";
};

export type ContextType = {
  addPoint: AddPoint;
  deletePoints: DeletePoints;
  editPointBadge: EditPointBadge;
  editPointBehavior: EditPointBehavior;
  editPointDangerousToUseDirectly: EditPointDangerousToUseDirectly;
  pointBehaviors: PointBehaviorsObject;
  points: Point[];
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

// This context should almost never be used directly.
// The ConsolePointsContext or SourceListPointsContext should be used instead.
// See the README for more information.
export const PointsContextDangerousToUseDirectly = createContext<ContextType>(null as any);

export function ContextRoot({ children }: PropsWithChildren<{}>) {
  const graphQLClient = useContext(GraphQLClientContext);
  const { accessToken, currentUserInfo, recordingId, trackEvent } = useContext(SessionContext);
  const replayClient = useContext(ReplayClientContext);

  const { setValue: setLocalPoints, value: localPoints } = useIndexedDB<Point[]>({
    database: POINTS_DATABASE,
    initialValue: EMPTY_ARRAY,
    recordName: recordingId,
    storeName: "points",
  });

  const { setValue: setPointBehaviors, value: pointBehaviors } = useIndexedDB<PointBehaviorsObject>(
    {
      database: POINTS_DATABASE,
      initialValue: EMPTY_OBJECT,
      recordName: recordingId,
      storeName: "point-behaviors",
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
    const mergedPoints: Point[] = [];
    localPoints?.forEach(point => {
      insert<Point>(mergedPoints, point, comparePoints);
    });
    remotePoints?.forEach(point => {
      const index = findIndex<Point>(mergedPoints, point, comparePoints);
      if (index < 0) {
        insert<Point>(mergedPoints, point, comparePoints);
      }
    });
    return mergedPoints;
  }, [localPoints, remotePoints]);

  // Track the latest committed values for e.g. the editPointBadge function.
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

  const editPointDangerousToUseDirectly = useCallback<EditPointDangerousToUseDirectly>(
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

      setPointBehaviors(prev => ({
        ...prev,
        [key]: {
          shouldBreak: prevPointBehavior?.shouldBreak ?? POINT_BEHAVIOR_DISABLED,
          shouldLog: prevPointBehavior?.shouldLog ?? POINT_BEHAVIOR_DISABLED,
          ...pointBehavior,
          key,
        },
      }));
    },
    [setPointBehaviors, trackEvent]
  );

  const editPointBadge = useCallback<EditPointBadge>(
    (key: PointKey, badge: Badge | null) => {
      editPointDangerousToUseDirectly(key, { badge });
    },
    [editPointDangerousToUseDirectly]
  );

  useBreakpointIdsFromServer(replayClient, mergedPoints, pointBehaviors, deletePoints);

  const context = useMemo(
    () => ({
      addPoint,
      deletePoints,
      editPointBadge,
      editPointBehavior,
      editPointDangerousToUseDirectly,
      pointBehaviors,
      points: mergedPoints,
    }),
    [
      addPoint,
      deletePoints,
      editPointBadge,
      editPointBehavior,
      editPointDangerousToUseDirectly,
      mergedPoints,
      pointBehaviors,
    ]
  );

  return (
    <PointsContextDangerousToUseDirectly.Provider value={context}>
      {children}
    </PointsContextDangerousToUseDirectly.Provider>
  );
}
