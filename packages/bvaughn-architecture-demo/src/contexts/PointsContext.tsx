import { Location, TimeStampedPoint } from "@replayio/protocol";
import sortedIndexBy from "lodash/sortedIndexBy";
import {
  PropsWithChildren,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point, PointId } from "shared/client/types";

import useBreakpointIdsFromServer from "../hooks/useBreakpointIdsFromServer";
import useLocalStorage from "../hooks/useLocalStorage";
import { SessionContext } from "./SessionContext";

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

export const PointsContext = createContext<PointsContextType>(null as any);

export function PointsContextRoot({ children }: PropsWithChildren<{}>) {
  const { recordingId, trackEvent } = useContext(SessionContext);
  const replayClient = useContext(ReplayClientContext);

  // Both high-pri state and transition state should be managed by useLocalStorage,
  // Else values from other tabs will only be synced to the high-pri state.
  const [points, setPoints] = useLocalStorage<Point[]>(`${recordingId}::points`, []);
  const [pointsForAnalysis, setPointsForAnalysis, isPending] = useLocalStorage<Point[]>(
    `${recordingId}::points::transition`,
    [],
    true
  );

  const setPointsHelper = useCallback(
    (action: SetStateAction<Point[]>) => {
      setPoints(action);
      setPointsForAnalysis(action);
    },
    [setPoints, setPointsForAnalysis]
  );

  const addPoint = useCallback(
    (partialPoint: Partial<Point> | null, location: Location) => {
      // Points (and their ids) are shared between tabs (via LocalStorage),
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
    () => ({ addPoint, deletePoints, editPoint, isPending, points, pointsForAnalysis }),
    [addPoint, deletePoints, editPoint, isPending, points, pointsForAnalysis]
  );

  return <PointsContext.Provider value={context}>{children}</PointsContext.Provider>;
}
