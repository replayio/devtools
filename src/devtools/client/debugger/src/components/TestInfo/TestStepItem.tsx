import { Object as ProtocolObject, createPauseResult } from "@replayio/protocol";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";

import { highlightNodes, unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getCurrentPoint } from "ui/actions/app";
import { seek, seekToTime, setTimelineToPauseTime, setTimelineToTime } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useTestStepActions } from "ui/hooks/useTestStepActions";
import { getSelectedStep, setSelectedStep } from "ui/reducers/reporter";
import {
  getCurrentTime,
  isDragging as isDraggingSelector,
  isPlaying as isPlayingSelector,
} from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AnnotatedTestStep } from "ui/types";

import { ProgressBar } from "./ProgressBar";
import { TestCaseContext } from "./TestCase";
import { TestInfoContext } from "./TestInfo";
import { TestInfoContextMenuContext } from "./TestInfoContextMenuContext";
import { TestStepRow } from "./TestStepRow";

export function returnFirst<T, R>(
  list: T[] | undefined,
  fn: (value: T, index: number, list: T[]) => R | null
) {
  return list ? list.reduce<R | null>((acc, v, i, l) => acc ?? fn(v, i, l), null) : null;
}

function useStepState(step: AnnotatedTestStep) {
  const currentTime = useAppSelector(getCurrentTime);
  const currentPoint = useAppSelector(getCurrentPoint);
  const isPlaying = useAppSelector(isPlayingSelector);
  const isDragging = useAppSelector(isDraggingSelector);

  const { point: pointEnd } = step.annotations.end || {};
  const { point: pointStart } = step.annotations.start || {};

  const shouldUseTimes = isPlaying || isDragging;

  if (step.relativeStartTime == null) {
    return "pending";
  }

  const currentPointBigInt = currentPoint ? BigInt(currentPoint) : null;
  const pointEndBigInt = pointEnd ? BigInt(pointEnd) : null;
  const isPast =
    !shouldUseTimes && currentPointBigInt && pointEndBigInt
      ? currentPointBigInt > pointEndBigInt
      : currentTime > step.absoluteStartTime;
  const isPaused =
    !shouldUseTimes && currentPointBigInt && pointEndBigInt && pointStart
      ? currentPointBigInt >= BigInt(pointStart) && currentPointBigInt <= pointEndBigInt
      : currentTime >= step.absoluteStartTime && currentTime < step.absoluteEndTime;

  if (isPaused) {
    return "paused";
  } else if (isPast) {
    return "past";
  }

  return "pending";
}

// relies on the scrolling parent to be the nearest positioning context
function scrollIntoView(node: HTMLDivElement) {
  if (!node.offsetParent) {
    return;
  }

  const parentBounds = node.offsetParent.getBoundingClientRect();
  const nodeBounds = node.getBoundingClientRect();

  if (nodeBounds.top < parentBounds.top || nodeBounds.bottom > parentBounds.bottom) {
    node.scrollIntoView();
  }
}

export interface TestStepItemProps {
  step: AnnotatedTestStep;
  argString?: string;
  index: number;
  id: string | null;
}

export function TestStepItem({ step, argString, index, id }: TestStepItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [localPauseData, setLocalPauseData] = useState<{
    startPauseId?: string;
    endPauseId?: string;
    consoleProps?: ProtocolObject;
  }>();
  const { setConsoleProps, setPauseId } = useContext(TestInfoContext);
  const [subjectNodePauseData, setSubjectNodePauseData] = useState<{
    pauseId: string;
    nodeIds: string[];
  }>();
  const isPlaying = useAppSelector(isPlayingSelector);
  const currentTime = useAppSelector(getCurrentTime);
  const selectedStep = useAppSelector(getSelectedStep);
  const dispatch = useAppDispatch();
  const client = useContext(ReplayClientContext);
  const { point: pointEnd, message: messageEnd } = step.annotations.end || {};
  const { point: pointStart } = step.annotations.start || {};
  const state = useStepState(step);

  // compare points if possible and
  useEffect(() => {
    let endPauseResult: createPauseResult | undefined;
    let startPauseResult: createPauseResult | undefined;

    (async () => {
      try {
        let consoleProps: ProtocolObject | undefined;

        endPauseResult = pointEnd ? await client.createPause(pointEnd) : undefined;
        startPauseResult = pointStart ? await client.createPause(pointStart) : undefined;
        const frames = endPauseResult?.data.frames;

        if (endPauseResult && frames) {
          const callerFrame = frames[1];

          if (messageEnd?.commandVariable) {
            const cmdResult = await client.evaluateExpression(
              endPauseResult.pauseId,
              `${messageEnd.commandVariable}.get("subject")`,
              callerFrame.frameId
            );

            const cmdObject = cmdResult.data.objects?.find(
              o => o.objectId === cmdResult.returned?.object
            );
            const length: number | undefined = cmdObject?.preview?.properties?.find(
              o => o.name === "length"
            )?.value;
            const subjects = Array.from({ length: length || 0 }, (_, i) =>
              cmdResult.data.objects?.find(
                obj =>
                  obj.objectId ===
                  cmdObject?.preview?.properties?.find(p => p.name === String(i))?.object
              )
            );

            const nodeIds = subjects.filter(s => s?.preview?.node).map(s => s?.objectId!);
            setSubjectNodePauseData({ pauseId: endPauseResult.pauseId, nodeIds });
          }

          if (messageEnd?.logVariable) {
            const logResult = await client.evaluateExpression(
              endPauseResult.pauseId,
              messageEnd.logVariable,
              callerFrame.frameId
            );

            const consolePropsProperty = returnFirst(logResult.data.objects, o => {
              return logResult.returned && o.objectId === logResult.returned.object
                ? returnFirst(o.preview?.properties, p => (p.name === "consoleProps" ? p : null))
                : null;
            });

            if (consolePropsProperty?.object) {
              const consolePropsPauseData = await client.getObjectWithPreview(
                consolePropsProperty.object,
                endPauseResult.pauseId
              );
              consoleProps = consolePropsPauseData.objects?.find(
                o => o.objectId === consolePropsProperty.object
              );
            }
          }

          setLocalPauseData({
            startPauseId: startPauseResult?.pauseId,
            endPauseId: endPauseResult.pauseId,
            consoleProps,
          });
        }
      } catch {
        setLocalPauseData(undefined);
      }
    })();
  }, [client, messageEnd, pointEnd, pointStart]);

  const onClick = useCallback(() => {
    if (id) {
      if (pointStart) {
        if (localPauseData?.endPauseId && localPauseData.consoleProps) {
          setConsoleProps(localPauseData.consoleProps);
          setPauseId(localPauseData.endPauseId);
        }
        dispatch(seek(pointStart!, step.absoluteStartTime, false, localPauseData?.startPauseId));
      } else {
        dispatch(seekToTime(step.absoluteStartTime, false));
      }

      dispatch(setSelectedStep(step));
    }
  }, [step, pointStart, localPauseData, dispatch, setConsoleProps, id, setPauseId]);

  const onMouseEnter = () => {
    if (state === "paused") {
      return;
    }

    dispatch(setTimelineToTime(step.absoluteStartTime));
    if (localPauseData?.startPauseId) {
      dispatch(
        setTimelineToPauseTime(
          step.absoluteStartTime,
          localPauseData.startPauseId,
          step.annotations.start?.point
        )
      );
    }
    if (subjectNodePauseData) {
      dispatch(highlightNodes(subjectNodePauseData.nodeIds, subjectNodePauseData.pauseId));
    }
  };
  const onMouseLeave = () => {
    if (state === "paused") {
      return;
    }

    dispatch(setTimelineToTime(null));
    dispatch(unhighlightNode());
  };

  useEffect(() => {
    if (
      !isPlaying &&
      ref.current &&
      currentTime >= step.absoluteStartTime &&
      currentTime <= step.absoluteEndTime
    ) {
      scrollIntoView(ref.current);
    }
  }, [isPlaying, ref, currentTime, step]);

  useEffect(() => {
    if (step.error && ref.current) {
      scrollIntoView(ref.current);
      onClick();
    }
  }, [step, ref, onClick]);

  // This math is bananas don't look here until this is cleaned up :)
  const bump = state !== "pending" ? 10 : 0;
  const actualProgress = bump + 90 * ((currentTime - step.absoluteStartTime) / step.duration);
  const progress = actualProgress > 100 ? 100 : actualProgress;
  const displayedProgress =
    (step.duration === 1 && state === "paused") || progress == 100 ? 0 : progress;

  return (
    <TestStepRow
      active={state === "paused"}
      pending={state === "pending"}
      error={!!step.error}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={ref}
      data-test-id="TestSuites-TestCase-TestStepRow"
    >
      <button onClick={onClick} className="flex flex-grow items-start space-x-2 text-start">
        <div title={"" + displayedProgress} className="flex h-4 items-center">
          <ProgressBar progress={displayedProgress} error={!!step.error} />
        </div>
        <div className="opacity-70 ">{index + 1}</div>
        <div className={`font-medium ${state === "paused" ? "font-bold" : ""}`}>
          {step.parentId ? "- " : ""}
          {step.name} <span className="opacity-70">{argString}</span>
        </div>
      </button>
      <Actions step={step} isSelected={selectedStep?.id === id} />
    </TestStepRow>
  );
}

function Actions({ step, isSelected }: { step: AnnotatedTestStep; isSelected: boolean }) {
  const { test } = useContext(TestCaseContext);
  const { show } = useContext(TestInfoContextMenuContext);
  const stepActions = useTestStepActions(step);

  if (!stepActions.canPlayback(test)) {
    return null;
  }

  const onClick = (e: React.MouseEvent) => {
    show({ x: e.pageX, y: e.pageY }, test, step);
  };

  return (
    <button
      onClick={onClick}
      className={`${isSelected ? "" : "invisible"} group-hover/step:visible`}
    >
      <div className="flex items-center">
        <MaterialIcon>more_vert</MaterialIcon>
      </div>
    </button>
  );
}
