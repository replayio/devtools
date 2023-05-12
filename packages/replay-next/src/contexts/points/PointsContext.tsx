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
import useRemotePoints from "replay-next/src/contexts/points/hooks/useRemotePoints";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Badge, Point, PointKey } from "shared/client/types";
import { updatePoint as updatePointGraphQL } from "shared/graphql/Points";

import useBreakpointIdsFromServer from "../../hooks/useBreakpointIdsFromServer";
import { SessionContext } from "../SessionContext";
import useAddPoint from "./hooks/useAddPoint";
import useDeletePoints from "./hooks/useDeletePoints";
import useDiscardPendingPoint from "./hooks/useDiscardPendingPoint";
import useEditPendingPoint from "./hooks/useEditPendingPoint";
import useEditPointBehavior from "./hooks/useEditPointBehavior";
import useLocalPointBehaviors from "./hooks/useLocalPointBehaviors";
import useLocalPoints from "./hooks/useLocalPoints";
import useSavePendingPoint from "./hooks/useSavePendingPoint";
import {
  AddPoint,
  DeletePoints,
  EditPendingPoint,
  EditPointBadge,
  EditPointBehavior,
  PointBehaviorsObject,
  SaveLocalAndRemotePoints,
  SaveOrDiscardPending,
} from "./types";

export type PointsContextType = {
  // Saves a new point to IndexedDB as well as GraphQL (if authenticated).
  addPoint: AddPoint;

  // Deletes all copies of a point (IndexedDB, GraphQL, and React state) at normal priority.
  deletePoints: DeletePoints;

  // These methods update points and behaviors at both normal and transition priorities.
  editPointBadge: EditPointBadge;
  editPointBehavior: EditPointBehavior;

  /************************************
   * Intended for use with components that suspend as a result of point text or behaviors.
   */

  // These values are updated at transition priority.
  pointBehaviorsForSuspense: PointBehaviorsObject;
  pointsForSuspense: Point[];

  // Points or behaviors have a pending transition.
  // Components may want to render a normal priority, non-suspending update (e.g. dim or spinner).
  pointsTransitionPending: boolean;

  /************************************
   * Intended for use with components that edit point text but to not suspend as a result of point text.
   */

  // These values are updated at normal priority.
  pointBehaviorsForDefaultPriority: PointBehaviorsObject;
  pointsForDefaultPriority: Point[];

  // These methods make pending changes to point text.
  // They must be explicitly saved or discarded once editing has finished.
  // Changes update SourceList points at normal priority (for editing UI)
  // but do not update Console points until/unless they are explicitly saved.
  discardPendingPoint: SaveOrDiscardPending;
  editPendingPoint: EditPendingPoint;
  savePendingPoint: SaveOrDiscardPending;
};

export const PointsContext = createContext<PointsContextType>(null as any);

export type CommittedValuesRef = {
  current: {
    pendingPoints: Map<PointKey, Pick<Point, "condition" | "content">>;
    points: Point[];
    pointBehaviors: PointBehaviorsObject;
  };
};

export function PointsContextRoot({ children }: PropsWithChildren<{}>) {
  const graphQLClient = useContext(GraphQLClientContext);
  const { accessToken, currentUserInfo, recordingId, trackEvent } = useContext(SessionContext);
  const replayClient = useContext(ReplayClientContext);

  const [localPoints, setLocalPoints] = useLocalPoints({ recordingId });
  const [localPointBehaviors, setLocalPointBehaviors] = useLocalPointBehaviors({ recordingId });
  const [remotePoints, setRemotePoints] = useRemotePoints({
    accessToken,
    graphQLClient,
    recordingId,
  });

  // Merge points from IndexedDB and GraphQL.
  // Current user points may exist in both places, so for simplicity we only include the local version.
  // This has an added benefit of ensuring edits/deletions always reflect the latest state
  // without requiring refetching data from GraphQL.
  const savedPoints = useMemo<Point[]>(() => {
    const mergedPoints: Point[] = Array.from(Object.values(localPoints));
    remotePoints.forEach(remotePoint => {
      if (localPoints[remotePoint.key] == null) {
        mergedPoints.push(remotePoint);
      }
    });
    return mergedPoints;
  }, [localPoints, remotePoints]);

  // Transition priority points and behaviors (for components that suspend)
  const deferredPoints = useDeferredValue(savedPoints);
  const deferredPointBehaviors = useDeferredValue(localPointBehaviors);
  const pointsTransitionPending =
    deferredPoints !== savedPoints || deferredPointBehaviors !== localPointBehaviors;

  // Pending point text edits go here until they're either saved or discarded.
  const [pendingPoints, setPendingPoints] = useState<
    Map<PointKey, Pick<Point, "condition" | "content">>
  >(new Map());

  // Merge saved points with local edits;
  // Local edits should take precedence so they're reflected in the Source viewer.
  const pointForDefaultPriority = useMemo<Point[]>(
    () =>
      savedPoints.map(point => {
        const partialPoint = pendingPoints.get(point.key);
        if (partialPoint) {
          return {
            ...point,
            ...partialPoint,
          };
        } else {
          return point;
        }
      }),
    [pendingPoints, savedPoints]
  );

  // Track the latest committed values for e.g. the editPointBadge function.
  const committedValuesRef = useRef<CommittedValuesRef["current"]>({
    pendingPoints: new Map(),
    points: [],
    pointBehaviors: {},
  });
  useEffect(() => {
    committedValuesRef.current.pendingPoints = pendingPoints;
    committedValuesRef.current.pointBehaviors = localPointBehaviors;
    committedValuesRef.current.points = savedPoints;
  });

  const addPoint = useAddPoint({
    accessToken,
    currentUserInfo,
    graphQLClient,
    recordingId,
    setLocalPoints,
    setLocalPointBehaviors,
    trackEvent,
  });

  const deletePoints = useDeletePoints({
    accessToken,
    committedValuesRef,
    graphQLClient,
    setLocalPoints,
    setLocalPointBehaviors,
    setPendingPoints,
    setRemotePoints,
    trackEvent,
  });

  const saveLocalAndRemotePoints = useCallback<SaveLocalAndRemotePoints>(
    (key: PointKey, partialPoint: Partial<Pick<Point, "badge" | "condition" | "content">>) => {
      trackEvent("breakpoint.edit");

      const { points } = committedValuesRef.current;
      const prevPoint = points.find(point => point.key === key);
      if (prevPoint) {
        const newPoint: Point = {
          ...prevPoint,
          ...partialPoint,
        };

        setLocalPoints(prev => {
          const cloned = { ...prev };
          cloned[key] = newPoint;
          return cloned;
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

  const editPointBadge = useCallback<EditPointBadge>(
    (key: PointKey, badge: Badge | null) => {
      saveLocalAndRemotePoints(key, { badge });
      setPendingPoints;
    },
    [saveLocalAndRemotePoints]
  );

  const editPointBehavior = useEditPointBehavior({
    committedValuesRef,
    setPointBehaviors: setLocalPointBehaviors,
    trackEvent,
  });

  const editPendingPoint = useEditPendingPoint({
    committedValuesRef,
    setPendingPoints,
  });

  const discardPendingPoint = useDiscardPendingPoint({ setPendingPoints });
  const savePendingPoint = useSavePendingPoint({
    committedValuesRef,
    saveLocalAndRemotePoints,
    setPendingPoints,
    setPointBehaviors: setLocalPointBehaviors,
  });

  useBreakpointIdsFromServer(replayClient, savedPoints, localPointBehaviors, deletePoints);

  const context = useMemo<PointsContextType>(
    () => ({
      addPoint,
      deletePoints,
      discardPendingPoint,
      editPendingPoint,
      editPointBadge,
      editPointBehavior,
      pointBehaviorsForSuspense: deferredPointBehaviors,
      pointBehaviorsForDefaultPriority: localPointBehaviors,
      pointsForSuspense: deferredPoints,
      pointsForDefaultPriority: pointForDefaultPriority,
      pointsTransitionPending,
      savePendingPoint,
    }),
    [
      addPoint,
      deferredPointBehaviors,
      deferredPoints,
      deletePoints,
      discardPendingPoint,
      editPendingPoint,
      editPointBadge,
      editPointBehavior,
      localPointBehaviors,
      pointForDefaultPriority,
      pointsTransitionPending,
      savePendingPoint,
    ]
  );

  return <PointsContext.Provider value={context}>{children}</PointsContext.Provider>;
}
