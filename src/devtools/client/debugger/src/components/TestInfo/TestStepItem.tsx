import { Object as ProtocolObject } from "@replayio/protocol";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";

import { highlightNodes, unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import { getObjectWithPreviewHelper } from "replay-next/src/suspense/ObjectPreviews";
import { evaluateAsync } from "replay-next/src/suspense/PauseCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { seek, seekToTime, setTimelineToPauseTime, setTimelineToTime } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getStepRanges, useStepState } from "ui/hooks/useStepState";
import { useTestStepActions } from "ui/hooks/useTestStepActions";
import { getSelectedStep, setSelectedStep } from "ui/reducers/reporter";
import { getCurrentTime, isPlaying as isPlayingSelector } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AnnotatedTestStep } from "ui/types";

import { ProgressBar } from "./ProgressBar";
import { TestCaseContext } from "./TestCase";
import { TestInfoContext } from "./TestInfo";
import { TestInfoContextMenuContext } from "./TestInfoContextMenuContext";
import { TestStepRow } from "./TestStepRow";

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
  const hasScrolled = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  const [localPauseData, setLocalPauseData] = useState<{
    startPauseFailed?: boolean;
    startPauseId?: string;
    endPauseFailed?: boolean;
    endPauseId?: string;
    consoleProps?: ProtocolObject;
  }>();
  const { loading, setLoading, setConsoleProps, setPauseId } = useContext(TestInfoContext);
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
    setLoading(true);

    (async () => {
      try {
        let consoleProps: ProtocolObject | undefined;

        const endPauseResult = pointEnd ? await client.createPause(pointEnd) : undefined;
        const frames = endPauseResult?.data.frames;

        if (endPauseResult && frames) {
          const callerFrame = frames[1];

          if (messageEnd?.commandVariable) {
            const cmdResult = await evaluateAsync(
              client,
              endPauseResult.pauseId,
              callerFrame.frameId,
              `${messageEnd.commandVariable}.get("subject")`
            );

            const cmdObjectId = cmdResult.returned?.object;

            if (cmdObjectId) {
              const cmdObject = await getObjectWithPreviewHelper(
                client,
                endPauseResult.pauseId,
                cmdObjectId,
                true
              );

              const props = cmdObject?.preview?.properties;
              const length: number = props?.find(o => o.name === "length")?.value || 0;
              const nodeIds = [];
              for (let i = 0; i < length; i++) {
                const v = props?.find(p => p.name === String(i));
                if (v?.object) {
                  nodeIds.push(v.object);
                }
              }

              setSubjectNodePauseData({ pauseId: endPauseResult.pauseId, nodeIds });
            }
          }

          if (messageEnd?.logVariable) {
            const logResult = await evaluateAsync(
              client,
              endPauseResult.pauseId,
              callerFrame.frameId,
              messageEnd.logVariable
            );

            if (logResult.returned?.object) {
              const logObject = await getObjectWithPreviewHelper(
                client,
                endPauseResult.pauseId,
                logResult.returned.object
              );
              const consolePropsProperty = logObject.preview?.properties?.find(
                p => p.name === "consoleProps"
              );

              if (consolePropsProperty?.object) {
                consoleProps = await getObjectWithPreviewHelper(
                  client,
                  endPauseResult.pauseId,
                  consolePropsProperty.object,
                  true
                );
              }
            }
          }

          const endPauseId = endPauseResult.pauseId;
          setLocalPauseData(v => ({
            ...v,
            endPauseFailed: false,
            endPauseId,
            consoleProps,
          }));
        }
      } catch {
        setLocalPauseData(v => ({
          ...v,
          endPauseFailed: true,
        }));
      }
    })();

    (async () => {
      try {
        const startPauseResult = pointStart ? await client.createPause(pointStart) : undefined;

        if (startPauseResult) {
          const startPauseId = startPauseResult.pauseId;
          setLocalPauseData(v => ({
            ...v,
            loading: false,
            startPauseId,
          }));
        }
      } catch {
        setLocalPauseData(v => ({
          ...v,
          startPauseFailed: true,
        }));
      }
    })();
  }, [client, messageEnd, pointEnd, pointStart, setLoading]);

  useEffect(() => {
    const { endPauseFailed, endPauseId } = localPauseData || {};
    // Loading is used by step details which only relies on the end pause
    // completing
    if (loading && (endPauseFailed || endPauseId)) {
      setLoading(false);
    }
  }, [localPauseData, loading, setLoading]);

  const { endPauseId, consoleProps } = localPauseData || {};
  const onClick = useCallback(() => {
    const { timeRange, pointRange } = getStepRanges(step);
    if (id && timeRange) {
      if (pointRange) {
        if (endPauseId && consoleProps) {
          setConsoleProps(consoleProps);
          setPauseId(endPauseId);
        }
        dispatch(seek(pointRange[1], timeRange[1], false, endPauseId));
      } else {
        dispatch(seekToTime(timeRange[1], false));
      }

      dispatch(setSelectedStep(step));
    }
  }, [step, endPauseId, consoleProps, dispatch, setConsoleProps, id, setPauseId]);

  const onMouseEnter = () => {
    if (state === "paused") {
      return;
    }

    dispatch(setTimelineToTime(step.absoluteEndTime));
    if (localPauseData?.endPauseId) {
      dispatch(
        setTimelineToPauseTime(
          step.absoluteEndTime,
          localPauseData.endPauseId,
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
    if (step.error && ref.current && !hasScrolled.current) {
      hasScrolled.current = true;
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
      <button
        onClick={onClick}
        className="flex w-0 flex-grow items-start space-x-2 text-start"
        title={`Step ${index + 1}: ${step.name} ${argString || ""}`}
      >
        <div title={"" + displayedProgress} className="flex h-4 items-center">
          <ProgressBar progress={displayedProgress} error={!!step.error} />
        </div>
        <div className="opacity-70 ">{index + 1}</div>
        <div className={`truncate font-medium ${state === "paused" ? "font-bold" : ""}`}>
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
