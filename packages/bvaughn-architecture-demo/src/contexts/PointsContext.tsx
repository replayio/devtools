import { SourceId } from "@replayio/protocol";
import { createContext, PropsWithChildren, useCallback, useMemo, useState } from "react";

type PointLocation = {
  sourceId: SourceId;
  columnNumber: number;
  lineNumber: number;
};

export type Point = PointLocation & {
  id: number;
  badge: string | null;
  content: string;
  enableBreaking: boolean;
  enabled: boolean;
  enableLogging: boolean;
};

export type PointsContextType = {
  addPoint: (partialPoint: Partial<Point> | null, pointLocation: PointLocation) => void;
  deletePoint: (id: number) => void;
  editPoint: (id: number, partialPoint: Partial<Point>) => void;
  points: Point[];
};

let idCounter: number = 0;

export const PointsContext = createContext<PointsContextType>(null as any);

export function PointsContextRoot({ children }: PropsWithChildren<{}>) {
  const [points, setPoints] = useState<Point[]>([]);

  const addPoint = useCallback(
    (partialPoint: Partial<Point> | null, pointLocation: PointLocation) => {
      const point: Point = {
        badge: null,
        content: "",
        enableBreaking: false,
        enabled: true,
        enableLogging: false,
        ...partialPoint,
        ...pointLocation,
        id: idCounter++,
      };

      setPoints(prevPoints => [...prevPoints, point]);
    },
    []
  );

  const deletePoint = useCallback((id: number) => {
    setPoints((prevPoints: Point[]) => {
      const index = prevPoints.findIndex(point => point.id === id);
      if (index >= 0) {
        const newPoints = prevPoints.slice();
        newPoints.splice(index, 1);
        return newPoints;
      }

      throw Error(`Could not find point with "${id}"`);
    });
  }, []);

  const editPoint = useCallback((id: number, partialPoint: Partial<Point>) => {
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
  }, []);

  const context = useMemo(
    () => ({ addPoint, deletePoint, editPoint, points }),
    [addPoint, deletePoint, editPoint, points]
  );

  return <PointsContext.Provider value={context}>{children}</PointsContext.Provider>;
}
