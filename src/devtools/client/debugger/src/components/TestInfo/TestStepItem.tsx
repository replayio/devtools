import classNames from "classnames";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";

import { highlightNodes, unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import { setHighlightedNodesLoading } from "devtools/client/inspector/markup/reducers/markup";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { seek, seekToTime, setTimelineToPauseTime, setTimelineToTime } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getStepRanges, useStepState } from "ui/hooks/useStepState";
import { useTestStepActions } from "ui/hooks/useTestStepActions";
import { getViewMode } from "ui/reducers/layout";
import { getSelectedStep, setSelectedStep } from "ui/reducers/reporter";
import { getCurrentTime, isPlaying as isPlayingSelector } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import {
  getCypressConsolePropsSuspense,
  getCypressSubjectNodeIdsAsync,
} from "ui/suspense/testStepCache";
import { AnnotatedTestStep } from "ui/types";

import { TestCaseContext } from "./TestCase";
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

async function awaitWithTimeout<T>(promise: Promise<T>, timeout = 500): Promise<T | undefined> {
  return Promise.race([
    new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), timeout)),
    promise,
  ]);
}

export function TestStepItem({ step, argString, index, id }: TestStepItemProps) {
  const isHovered = useRef(false);
  const hasScrolled = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  const [subjectNodePauseData, setSubjectNodePauseData] = useState<
    Promise<{
      pauseId: string | undefined;
      nodeIds: string[] | undefined;
      point: string | undefined;
    }>
  >();
  const viewMode = useAppSelector(getViewMode);
  const isPlaying = useAppSelector(isPlayingSelector);
  const currentTime = useAppSelector(getCurrentTime);
  const selectedStep = useAppSelector(getSelectedStep);
  const dispatch = useAppDispatch();
  const client = useContext(ReplayClientContext);
  const state = useStepState(step);
  const actions = useTestStepActions(step);

  useEffect(() => {
    setSubjectNodePauseData(getCypressSubjectNodeIdsAsync(client, step));
  }, [client, step]);

  const onClick = useCallback(async () => {
    const { timeRange, pointRange } = getStepRanges(step);
    if (id && timeRange && subjectNodePauseData) {
      const pauseData = await awaitWithTimeout(subjectNodePauseData);
      if (pointRange && pauseData?.pauseId) {
        dispatch(seek(pointRange[1], timeRange[1], false, pauseData?.pauseId));
      } else {
        dispatch(seekToTime(timeRange[1], false));
      }

      if (viewMode === "dev") {
        actions.showStepSource();
      }

      dispatch(setSelectedStep(step));
    }
  }, [actions, viewMode, step, subjectNodePauseData, dispatch, id]);

  const onMouseEnter = async () => {
    isHovered.current = true;
    if (state === "paused" || !subjectNodePauseData) {
      return;
    }

    try {
      let pauseData = await Promise.race([
        new Promise<"timeout">(resolve => setTimeout(() => resolve("timeout"), 500)),
        subjectNodePauseData,
      ]);

      if (pauseData === "timeout") {
        dispatch(setHighlightedNodesLoading(true));
        pauseData = await subjectNodePauseData;

        if (!isHovered.current) {
          return;
        }

        dispatch(setHighlightedNodesLoading(false));
      }

      const { pauseId, point, nodeIds } = pauseData;

      if (!pauseId) {
        dispatch(setTimelineToTime(step.absoluteEndTime));
        return;
      }

      dispatch(setTimelineToPauseTime(step.absoluteEndTime, pauseId, point));

      if (nodeIds) {
        dispatch(highlightNodes(nodeIds, pauseId));
      }
    } catch (e) {
      console.error("Failed to highlight nodes");
      console.error(e);
    }
  };
  const onMouseLeave = () => {
    isHovered.current = false;
    dispatch(setHighlightedNodesLoading(false));

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
