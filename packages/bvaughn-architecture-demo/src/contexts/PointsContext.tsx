import { Location, SourceId } from "@replayio/protocol";
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";

export type Point = {
  badge: string | null;
  condition: string | null;
  content: string;
  enableBreaking: boolean;
  enableLogging: boolean;
  id: number;
  location: Location;
};

export type PointsContextType = {
  addPoint: (partialPoint: Partial<Point> | null, location: Location) => void;
  deletePoint: (id: number) => void;
  editPoint: (id: number, partialPoint: Partial<Point>) => void;
  isPending: boolean;
  points: Point[];
  pointsForAnalysis: Point[];
};

let idCounter: number = 0;

export const PointsContext = createContext<PointsContextType>(null as any);

export function PointsContextRoot({ children }: PropsWithChildren<{}>) {
  const [points, setPoints] = useState<Point[]>([]);
  const [pointsForAnalysis, setPointsForAnalysis] = useState<Point[]>([]);

  const [isPending, startTransition] = useTransition();

  const setPointsHelper = useCallback((updater: SetStateAction<Point[]>) => {
    setPoints(updater);
    startTransition(() => {
      setPointsForAnalysis(updater);
    });
  }, []);

  const addPoint = useCallback(
    (partialPoint: Partial<Point> | null, location: Location) => {
      const point: Point = {
        badge: null,
        content: "",
        condition: null,
        enableBreaking: false,
        enableLogging: false,
        ...partialPoint,
        id: idCounter++,
        location,
      };

      setPointsHelper(prevPoints => [...prevPoints, point]);
    },
    [setPointsHelper]
  );

  const deletePoint = useCallback(
    (id: number) => {
      setPointsHelper((prevPoints: Point[]) => {
        const index = prevPoints.findIndex(point => point.id === id);
        if (index >= 0) {
          const newPoints = prevPoints.slice();
          newPoints.splice(index, 1);
          return newPoints;
        }

        throw Error(`Could not find point with "${id}"`);
      });
    },
    [setPointsHelper]
  );

  const editPoint = useCallback(
    (id: number, partialPoint: Partial<Point>) => {
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

  const context = useMemo(
    () => ({ addPoint, deletePoint, editPoint, isPending, points, pointsForAnalysis }),
    [addPoint, deletePoint, editPoint, isPending, points, pointsForAnalysis]
  );

  return <PointsContext.Provider value={context}>{children}</PointsContext.Provider>;
}
