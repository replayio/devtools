import { Location, TimeStampedPoint } from "@replayio/protocol";
import sortedIndexBy from "lodash/sortedIndexBy";
import {
  createContext,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
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

let idCounter: number = 0;

export const PointsContext = createContext<PointsContextType>(null as any);

export function PointsContextRoot({ children }: PropsWithChildren<{}>) {
  const { recordingId } = useContext(SessionContext);
  const [points, setPoints] = useLocalStorage<Point[]>(`${recordingId}::points`, []);
  const [pointsForAnalysis, setPointsForAnalysis] = useState<Point[]>(points);

  const [isPending, startTransition] = useTransition();

  const setPointsHelper = useCallback(
    (updater: SetStateAction<Point[]>) => {
      setPoints(updater);
      startTransition(() => {
        setPointsForAnalysis(updater);
      });
    },
    [setPoints]
  );

  const addPoint = useCallback(
    (partialPoint: Partial<Point> | null, location: Location) => {
      const point: Point = {
        badge: null,
        content: "",
        condition: null,
        createdAtTime: Date.now(),
        shouldBreak: false,
        shouldLog: false,
        ...partialPoint,
        id: idCounter++,
        location,
      };

      setPointsHelper((prevPoints: Point[]) => {
        const index = sortedIndexBy(prevPoints, point, ({ location }) => location.line);

        return prevPoints.slice(0, index).concat([point], prevPoints.slice(index));
      });
    },
    [setPointsHelper]
  );

  const deletePoints = useCallback(
    (...ids: PointId[]) =>
      setPointsHelper((prevPoints: Point[]) => prevPoints.filter(point => !ids.includes(point.id))),
    [setPointsHelper]
  );

  const editPoint = useCallback(
    (id: PointId, partialPoint: Partial<Point>) => {
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

        throw Error(`Could not find point with "${id}"`);
      });
    },
    [setPointsHelper]
  );

  useBreakpointIdsFromServer(points, editPoint);

  const context = useMemo(
    () => ({ addPoint, deletePoints, editPoint, isPending, points, pointsForAnalysis }),
    [addPoint, deletePoints, editPoint, isPending, points, pointsForAnalysis]
  );

  return <PointsContext.Provider value={context}>{children}</PointsContext.Provider>;
}
