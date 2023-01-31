import classNames from "classnames";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";

import { highlightNodes, unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import { getFramesAsync } from "replay-next/src/suspense/FrameCache";
import { getObjectWithPreviewHelper } from "replay-next/src/suspense/ObjectPreviews";
import { evaluateAsync, getPauseIdAsync } from "replay-next/src/suspense/PauseCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import { seek, seekToTime, setTimelineToPauseTime, setTimelineToTime } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getStepRanges, useStepState } from "ui/hooks/useStepState";
import { useTestInfo } from "ui/hooks/useTestInfo";
import { useTestStepActions } from "ui/hooks/useTestStepActions";
import { getViewMode } from "ui/reducers/layout";
import { getSelectedStep, setSelectedStep } from "ui/reducers/reporter";
import { getCurrentTime, isPlaying as isPlayingSelector } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AnnotatedTestStep } from "ui/types";

import { getCypressConsolePropsSuspense } from "./getCypressConsolePropsSuspense";
import { TestCaseContext } from "./TestCase";
import { TestInfoContext } from "./TestInfo";
import { TestInfoContextMenuContext } from "./TestInfoContextMenuContext";
import { TestStepRow } from "./TestStepRow";
import styles from "./TestStepItem.module.css";

function preventClickFromSpaceBar(ev: React.KeyboardEvent<HTMLButtonElement>) {
  if (ev.key === " ") {
    ev.preventDefault();
  }
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

async function getCypressSubjectNodeIds(
  client: ReplayClientInterface,
  endPauseId?: string,
  callerFrameId?: string,
  commandVariable?: string
) {
  if (!endPauseId || !callerFrameId || !commandVariable) {
    return [];
  }

  const cmdResult = await evaluateAsync(
    client,
    endPauseId,
    callerFrameId,
    `${commandVariable}.get("subject")`
  );

  const cmdObjectId = cmdResult.returned?.object;

  if (cmdObjectId) {
    const cmdObject = await getObjectWithPreviewHelper(client, endPauseId, cmdObjectId, true);

    const props = cmdObject?.preview?.properties;
    const length: number = props?.find(o => o.name === "length")?.value || 0;
    const nodeIds = [];
    for (let i = 0; i < length; i++) {
      const v = props?.find(p => p.name === String(i));
      if (v?.object) {
        nodeIds.push(v.object);
      }
    }

    return nodeIds;
  }

  return [];
}

export function TestStepItem({ step, argString, index, id }: TestStepItemProps) {
  const hasScrolled = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  const [subjectNodePauseData, setSubjectNodePauseData] = useState<{
    pauseId: string;
    nodeIds: string[];
  }>();
  const viewMode = useAppSelector(getViewMode);
  const isPlaying = useAppSelector(isPlayingSelector);
  const currentTime = useAppSelector(getCurrentTime);
  const selectedStep = useAppSelector(getSelectedStep);
  const dispatch = useAppDispatch();
  const client = useContext(ReplayClientContext);
  const { point: pointEnd, message: messageEnd, time: timeEnd } = step.annotations.end || {};
  const state = useStepState(step);
  const actions = useTestStepActions(step);

  useEffect(() => {
    (async () => {
      const endPauseId =
        pointEnd && timeEnd != null ? await getPauseIdAsync(client, pointEnd, timeEnd) : undefined;
      const frames = endPauseId ? await getFramesAsync(client, endPauseId) : undefined;

      if (endPauseId && frames) {
        const callerFrame = frames[1];

        await getCypressSubjectNodeIds(
          client,
          endPauseId,
          callerFrame.frameId,
          messageEnd?.commandVariable
        ).then(nodeIds => setSubjectNodePauseData({ pauseId: endPauseId, nodeIds }));
      }
    })();
  }, [client, messageEnd, timeEnd, pointEnd]);

  const { pauseId: endPauseId } = subjectNodePauseData || {};
  const onClick = useCallback(() => {
    const { timeRange, pointRange } = getStepRanges(step);
    if (id && timeRange) {
      if (pointRange) {
        dispatch(seek(pointRange[1], timeRange[1], false, endPauseId));
      } else {
        dispatch(seekToTime(timeRange[1], false));
      }

      if (viewMode === "dev") {
        actions.showStepSource();
      }

      dispatch(setSelectedStep(step));
    }
  }, [actions, viewMode, step, endPauseId, dispatch, id]);

  const onMouseEnter = () => {
    if (state === "paused") {
      return;
    }

    dispatch(setTimelineToTime(step.absoluteEndTime));
    if (subjectNodePauseData?.pauseId) {
      dispatch(
        setTimelineToPauseTime(
          step.absoluteEndTime,
          subjectNodePauseData.pauseId,
          step.annotations.end?.point
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
  const isSelected = selectedStep?.id === id;

  return (
    <TestStepRow
      active={state === "paused"}
      pending={state === "pending"}
      error={!!step.error}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={ref}
      data-test-id="TestSuites-TestCase-TestStepRow"
      index={index + 1}
      progress={displayedProgress}
    >
      <button
        onClick={onClick}
        onKeyUp={preventClickFromSpaceBar}
        className="flex w-0 flex-grow items-start space-x-2 text-start"
        title={`Step ${index + 1}: ${step.name} ${argString || ""}`}
      >
        <div className={`flex-grow font-medium ${state === "paused" ? "font-bold" : ""}`}>
          {step.parentId ? "- " : ""}{" "}
          <span className={`${styles.step} ${styles[step.name]}`}>{step.name}</span>
          <span className="opacity-70">{argString}</span>
        </div>
      </button>
      <MatchingElementBadge selected={isSelected} step={step} />
      {step.alias ? (
        <span
          className={classNames(
            "-my-1 flex-shrink rounded p-1 text-xs text-gray-800",
            isSelected ? "bg-gray-300" : "bg-gray-200"
          )}
          title={`'${argString}' aliased as '${step.alias}'`}
        >
          {step.alias}
        </span>
      ) : null}
      <Actions step={step} selected={isSelected} />
    </TestStepRow>
  );
}

function MatchingElementBadge({ step, selected }: { step: AnnotatedTestStep; selected: boolean }) {
  const client = useContext(ReplayClientContext);

  if (step.name !== "get") {
    return null;
  }

  const { pauseId, consoleProps } = getCypressConsolePropsSuspense(client, step) || {};

  const count = consoleProps?.preview?.properties?.find(p => p.name === "Elements")?.value;

  if (!pauseId || !count || count < 1) {
    // maybe an error?
    return null;
  }

  return (
    <span
      className={classNames(
        "-my-1 flex-shrink rounded p-1 text-xs text-gray-800",
        selected ? "bg-gray-300" : "bg-gray-200"
      )}
    >
      {count}
    </span>
  );
}

function Actions({ step, selected }: { step: AnnotatedTestStep; selected: boolean }) {
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
    <button onClick={onClick} className={`${selected ? "" : "invisible"} group-hover/step:visible`}>
      <div className="flex items-center">
        <MaterialIcon>more_vert</MaterialIcon>
      </div>
    </button>
  );
}
