import { Location, SourceId } from "@replayio/protocol";
import {
  createContext,
  PropsWithChildren,
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
};

let idCounter: number = 0;

export const PointsContext = createContext<PointsContextType>(null as any);

export function PointsContextRoot({ children }: PropsWithChildren<{}>) {
  const [points, setPoints] = useState<Point[]>([]);
  const [isPending, startTransition] = useTransition();

  const addPoint = useCallback((partialPoint: Partial<Point> | null, location: Location) => {
    startTransition(() => {
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

      setPoints(prevPoints => [...prevPoints, point]);
    });
  }, []);

  const deletePoint = useCallback((id: number) => {
    startTransition(() => {
      setPoints((prevPoints: Point[]) => {
        const index = prevPoints.findIndex(point => point.id === id);
        if (index >= 0) {
          const newPoints = prevPoints.slice();
          newPoints.splice(index, 1);
          return newPoints;
        }

        throw Error(`Could not find point with "${id}"`);
      });
    });
  }, []);

  const editPoint = useCallback((id: number, partialPoint: Partial<Point>) => {
    startTransition(() => {
      setPoints((prevPoints: Point[]) => {
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
    });
  }, []);

  const context = useMemo(
    () => ({ addPoint, deletePoint, editPoint, isPending, points }),
    [addPoint, deletePoint, editPoint, isPending, points]
  );

  return <PointsContext.Provider value={context}>{children}</PointsContext.Provider>;
}
