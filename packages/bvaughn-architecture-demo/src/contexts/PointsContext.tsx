import { Location, TimeStampedPoint } from "@replayio/protocol";
import sortedIndexBy from "lodash/sortedIndexBy";
import {
  PropsWithChildren,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point, PointId } from "shared/client/types";

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
  pointsForAnalysis: Point[];
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
  const { recordingId, trackEvent } = useContext(SessionContext);
  const replayClient = useContext(ReplayClientContext);

  // Both high-pri state and transition state should be managed by useIndexedDB,
  // Else values from other tabs will only be synced to the high-pri state.
  const { setValue: setPoints, value: points } = useIndexedDB<Point[]>({
    database: POINTS_DATABASE,
    initialValue: EMPTY_ARRAY,
    recordName: recordingId,
    storeName: "high-priority",
  });
  const {
    setValue: setPointsForAnalysis,
    status: pointsForAnalysisStatus,
    value: pointsForAnalysis,
  } = useIndexedDB<Point[]>({
    database: POINTS_DATABASE,
    initialValue: EMPTY_ARRAY,
    recordName: recordingId,
    scheduleUpdatesAsTransitions: true,
    storeName: "transition",
  });

  const isPending = pointsForAnalysisStatus === "update-pending";

  const setPointsHelper = useCallback(
    (action: SetStateAction<Point[]>) => {
      setPoints(action);
      setPointsForAnalysis(action);
    },
    [setPoints, setPointsForAnalysis]
  );

  const addPoint = useCallback(
    (partialPoint: Partial<Point> | null, location: Location) => {
      // Points (and their ids) are shared between tabs (via IndexedDB),
      // so the id numbers should be deterministic;
      // a single incrementing counter wouldn't work well unless it was also synced.
      const id = `${location.sourceId}:${location.line}:${location.column}`;

      const point: Point = {
        badge: null,
        content: "",
        condition: null,
        createdAtTime: Date.now(),
        shouldBreak: false,
        shouldLog: false,
        ...partialPoint,
        id,
        location,
      };

      trackEvent("breakpoint.add");
      // TODO Determine if we should track "breakpoint.add_column" here

      setPointsHelper((prevPoints: Point[]) => {
        const index = sortedIndexBy(prevPoints, point, ({ location }) => location.line);
        return prevPoints.slice(0, index).concat([point], prevPoints.slice(index));
      });
    },
    [setPointsHelper, trackEvent]
  );

  const deletePoints = useCallback(
    (...ids: PointId[]) => {
      trackEvent("breakpoint.remove");
      setPointsHelper((prevPoints: Point[]) => prevPoints.filter(point => !ids.includes(point.id)));
    },

    [setPointsHelper, trackEvent]
  );

  const editPoint = useCallback(
    (id: PointId, partialPoint: Partial<Point>) => {
      trackEvent("breakpoint.edit");
      setPointsHelper((prevPoints: Point[]) => {
        const index = prevPoints.findIndex(point => point.id === id);
        if (index >= 0) {
          const prevPoint = prevPoints[index];
          const newPoint: Point = {
            ...prevPoint,
            ...partialPoint,
          };
          const points = prevPoints.slice();
          points.splice(index, 1, newPoint);
          return points;
        }
        throw Error(`Could not find point with id "${id}"`);
      });
    },
    [setPointsHelper, trackEvent]
  );

  useBreakpointIdsFromServer(points, editPoint, deletePoints, replayClient);

  const context = useMemo(
    () => ({
      addPoint,
      deletePoints,
      editPoint,
      isPending,
      points: points,
      pointsForAnalysis: pointsForAnalysis,
    }),
    [addPoint, deletePoints, editPoint, isPending, points, pointsForAnalysis]
  );

  return <PointsContext.Provider value={context}>{children}</PointsContext.Provider>;
}
