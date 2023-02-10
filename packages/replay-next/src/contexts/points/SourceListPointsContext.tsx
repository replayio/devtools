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

import { PointsContext, PointsContextType } from "replay-next/src/contexts/points/PointsContext";
import { Point, PointKey } from "shared/client/types";

import { DeletePoints, EditPointText } from "./types";

type SaveOrDiscardPendingChanges = (key: PointKey) => void;

export type ContextType = Omit<PointsContextType, "editPointDangerousToUseDirectly"> & {
  // Points are updated at default/high priority.
  // They are intended for use with components that edit points or behaviors.
  points: Point[];

  // These methods make pending changes to points.
  // Those changes are updated immediately (for display purposes)
  // but must be explicitly saved or discarded once editing has finished.
  editPointText: EditPointText;
  discardPendingPoint: SaveOrDiscardPendingChanges;
  savePendingPoint: SaveOrDiscardPendingChanges;
};

export const Context = createContext<ContextType>(null as unknown as ContextType);

export function ContextRoot({ children }: PropsWithChildren) {
  const pointsContext = useContext(PointsContext);

  const {
    deletePoints: deleteSavedPoints,
    editPointDangerousToUseDirectly,
    points: savedPoints,
    ...pointsContextRest
  } = pointsContext;

  // Local edits go here until they're either saved or discarded.
  const [pendingPartialPoints, setPendingPartialPoints] = useState<
    Map<PointKey, Pick<Point, "condition" | "content">>
  >(new Map());

  // Track the latest committed values for e.g. the editPoint function.
  const committedValuesRef = useRef<{
    pendingPartialPoints: Map<PointKey, Pick<Point, "condition" | "content">>;
    savedPoints: Point[];
  }>({ pendingPartialPoints: new Map(), savedPoints: [] });
  useEffect(() => {
    committedValuesRef.current.pendingPartialPoints = pendingPartialPoints;
    committedValuesRef.current.savedPoints = savedPoints;
  });

  const editPointText = useCallback<EditPointText>(
    (key: PointKey, partialPoint: Partial<Pick<Point, "condition" | "content">>) => {
      const { pendingPartialPoints, savedPoints } = committedValuesRef.current;
      const prevPendingPoint = pendingPartialPoints.get(key);
      const prevSavedPoint = savedPoints.find(point => point.key === key);

      const pendingPoint: Point = {
        ...(prevSavedPoint as Point),
        ...prevPendingPoint,
        ...partialPoint,
      };

      setPendingPartialPoints(prev => {
        const cloned = new Map(prev.entries());
        cloned.set(key, pendingPoint);
        return cloned;
      });
    },
    []
  );

  const deletePoints = useCallback<DeletePoints>(
    (...keys: PointKey[]) => {
      setPendingPartialPoints(prev => {
        const cloned = new Map(prev.entries());
        keys.forEach(key => cloned.delete(key));
        return cloned;
      });

      deleteSavedPoints(...keys);
    },
    [deleteSavedPoints]
  );

  const discardPendingPoint = useCallback<SaveOrDiscardPendingChanges>((key: PointKey) => {
    setPendingPartialPoints(prev => {
      const cloned = new Map(prev.entries());
      cloned.delete(key);
      return cloned;
    });
  }, []);

  const savePendingPoint = useCallback<SaveOrDiscardPendingChanges>(
    (key: PointKey) => {
      const { pendingPartialPoints } = committedValuesRef.current;
      const pendingPoint = pendingPartialPoints.get(key);
      if (pendingPoint) {
        editPointDangerousToUseDirectly(key, pendingPoint);
      }
      discardPendingPoint(key);
    },
    [discardPendingPoint, editPointDangerousToUseDirectly]
  );

  // Merge saved points with local edits;
  // Local edits should take precedence so they're reflected in the Source viewer.
  const mergedPoints = useMemo<Point[]>(
    () =>
      savedPoints.map(point => {
        const partialPoint = pendingPartialPoints.get(point.key);
        if (partialPoint) {
          return {
            ...point,
            ...partialPoint,
          };
        } else {
          return point;
        }
      }),
    [pendingPartialPoints, savedPoints]
  );

  const context = useMemo<ContextType>(
    () => ({
      ...pointsContextRest,

      // Extend to also delete pending edits
      deletePoints,

      // Source List specific context values
      discardPendingPoint,
      editPointText,
      points: mergedPoints,
      savePendingPoint,
    }),
    [
      deletePoints,
      discardPendingPoint,
      editPointText,
      mergedPoints,
      pointsContextRest,
      savePendingPoint,
    ]
  );

  return <Context.Provider value={context}>{children}</Context.Provider>;
}
