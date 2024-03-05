import { ExecutionPoint, PauseId } from "@replayio/protocol";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { isExecutionPointsGreaterThan } from "replay-next/src/utils/time";
import { generateTreeResetOpsForPoint } from "ui/components/SecondaryToolbox/react-devtools/rdtProcessing";
import { ReactDevToolsListData } from "ui/components/SecondaryToolbox/react-devtools/ReactDevToolsListData";
import { ReplayWall } from "ui/components/SecondaryToolbox/react-devtools/ReplayWall";
import { isPlaying as isPlayingSelector } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";
import { ParsedReactDevToolsAnnotation } from "ui/suspense/annotationsCaches";

import { cacheRendererIdsToFiberIds } from "../injectReactDevtoolsBackend";

export function useReactDevToolsAnnotations({
  annotations,
  executionPoint: currentExecutionPoint,
  listData,
  pauseId: currentPauseId,
  wall,
}: {
  annotations: ParsedReactDevToolsAnnotation[];
  executionPoint: ExecutionPoint | null;
  listData: ReactDevToolsListData | null;
  pauseId: PauseId | null;
  wall: ReplayWall;
}) {
  const isPlaying = useAppSelector(isPlayingSelector);

  const prevValuesRef = useRef<{
    executionPoint: ExecutionPoint | null;
    firstExcludedAnnotationIndex: number | null;
    pauseId: PauseId | null;
    wall: ReplayWall;
  }>({
    executionPoint: null,
    firstExcludedAnnotationIndex: null,
    pauseId: null,
    wall,
  });

  const firstExcludedAnnotationIndex = useMemo(() => {
    if (isPlaying) {
      return 0;
    } else if (annotations && currentExecutionPoint) {
      const index = annotations.findIndex(annotation =>
        isExecutionPointsGreaterThan(annotation.point, currentExecutionPoint)
      );
      return index < 0 ? annotations.length : index;
    } else {
      return 0;
    }
  }, [annotations, currentExecutionPoint, isPlaying]);

  useLayoutEffect(() => {
    if (!currentExecutionPoint || !currentPauseId || isPlaying) {
      return;
    }

    const {
      executionPoint: previousExecutionPoint,
      firstExcludedAnnotationIndex: prevFirstExcludedAnnotationIndex,
      pauseId: prevPauseId,
      wall: prevWall,
    } = prevValuesRef.current;

    if (
      prevFirstExcludedAnnotationIndex === null ||
      currentExecutionPoint !== previousExecutionPoint ||
      currentPauseId !== prevPauseId ||
      prevFirstExcludedAnnotationIndex !== firstExcludedAnnotationIndex ||
      wall !== prevWall
    ) {
      prevValuesRef.current.executionPoint = currentExecutionPoint;
      prevValuesRef.current.firstExcludedAnnotationIndex = firstExcludedAnnotationIndex;
      prevValuesRef.current.pauseId = currentPauseId;

      const filteredAnnotations =
        firstExcludedAnnotationIndex >= 0
          ? annotations.slice(0, firstExcludedAnnotationIndex)
          : annotations;

      // We keep the one RDT UI component instance alive, but operations are additive over time.
      // In order to reset the displayed component tree, we first need to generate a set of fake
      // "remove this React root" operations based on where we _were_ paused, and inject those.
      if (previousExecutionPoint) {
        const clearTreeOperations = generateTreeResetOpsForPoint(
          previousExecutionPoint,
          annotations
        );

        for (const rootRemovalOp of clearTreeOperations) {
          wall.sendAnnotation({ event: "operations", payload: rootRemovalOp });
        }
      }

      // Now that the displayed tree is empty, we can inject all operations up to the _current_ point in time.
      for (const { contents } of filteredAnnotations) {
        if (contents.event === "operations") {
          wall.sendAnnotation(contents);
        }
      }

      wall.setPauseId(currentPauseId);

      cacheRendererIdsToFiberIds(currentPauseId, wall.store!);

      if (listData) {
        listData.processMutatedStore();
      }
    }
  }, [
    annotations,
    currentExecutionPoint,
    currentPauseId,
    firstExcludedAnnotationIndex,
    isPlaying,
    listData,
    wall,
  ]);

  return firstExcludedAnnotationIndex > 0;
}
