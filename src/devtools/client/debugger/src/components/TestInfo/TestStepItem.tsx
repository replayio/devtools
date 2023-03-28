import classNamesBind from "classnames/bind";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { highlightNodes, unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import { setHighlightedNodesLoading } from "devtools/client/inspector/markup/reducers/markup";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { AnnotatedTestStep } from "shared/graphql/types";
import { seek, seekToTime, setTimelineToPauseTime, setTimelineToTime } from "ui/actions/timeline";
import { jumpToClickEventFunctionLocation } from "ui/components/Events/Event";
import { PointWithEventType } from "ui/components/Events/Event";
import { JumpToCodeButton, JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getStepRanges, useStepState } from "ui/hooks/useStepState";
import { useTestInfo } from "ui/hooks/useTestInfo";
import { useTestStepActions } from "ui/hooks/useTestStepActions";
import { getViewMode } from "ui/reducers/layout";
import { getSelectedStep, setSelectedStep } from "ui/reducers/reporter";
import { getCurrentTime, isPlaying as isPlayingSelector } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import {
  getCypressConsolePropsSuspense,
  getCypressSubjectNodeIdsAsync,
} from "ui/suspense/testStepCache";
import { AwaitTimeout, awaitWithTimeout } from "ui/utils/awaitWithTimeout";

import { TestCaseContext } from "./TestCase";
import { TestInfoContextMenuContext } from "./TestInfoContextMenuContext";
import { TestStepRow } from "./TestStepRow";
import styles from "./TestInfo.module.css";

const classNames = classNamesBind.bind(styles);

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
    node.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

export interface TestStepItemProps {
  step: AnnotatedTestStep;
  argString?: string;
  index: number;
  id: string | null;
  autoSelect?: boolean;
}

export function TestStepItem({
  step,
  argString,
  index,
  id,
  autoSelect = false,
}: TestStepItemProps) {
  const isHovered = useRef(false);
  const autoSelectState = useRef(0);
  const ref = useRef<HTMLDivElement>(null);
  const client = useContext(ReplayClientContext);
  const getSubjectNodePauseData = useMemo(() => {
    let promise: ReturnType<typeof getCypressSubjectNodeIdsAsync> | undefined;

    return async () => {
      if (!promise) {
        promise = getCypressSubjectNodeIdsAsync(client, step);
      }

      return promise;
    };
  }, [client, step]);
  const viewMode = useAppSelector(getViewMode);
  const isPlaying = useAppSelector(isPlayingSelector);
  const currentTime = useAppSelector(getCurrentTime);
  const selectedStep = useAppSelector(getSelectedStep);
  const executionPoint = useAppSelector(getExecutionPoint);
  const dispatch = useAppDispatch();
  const state = useStepState(step);
  const actions = useTestStepActions(step);
  const info = useTestInfo();
  const [jumpToCodeStatus, setJumpToCodeStatus] = useState<JumpToCodeStatus>("not_checked");

  const onClick = useCallback(async () => {
    const { timeRange, pointRange } = getStepRanges(step);

    if (id && timeRange) {
      const pauseData = await awaitWithTimeout(getSubjectNodePauseData());
      if (pointRange && pauseData !== AwaitTimeout) {
        dispatch(seek(pointRange[1], timeRange[1], false, pauseData.pauseId));
      } else {
        dispatch(seekToTime(timeRange[1], false));
      }

      if (viewMode === "dev") {
        actions.showStepSource();
      }

      dispatch(setSelectedStep(step));

      return true;
    }
  }, [actions, viewMode, step, getSubjectNodePauseData, dispatch, id]);

  const onMouseEnter = async () => {
    isHovered.current = true;
    if (state === "paused" || !getSubjectNodePauseData) {
      return;
    }

    try {
      let pauseData = await awaitWithTimeout(getSubjectNodePauseData());

      if (pauseData === AwaitTimeout) {
        dispatch(setHighlightedNodesLoading(true));
        pauseData = await getSubjectNodePauseData();

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

  const onJumpToClickEvent = async () => {
    const onSeek = (point: string, time: number) => dispatch(seek(point, time, true));
    // We only support clicks and keypress events for now.
    // The rendering logic has limited the button display

    const cypressStepTypesToEventTypes = {
      click: "mousedown",
      type: "keypress",
    } as const;
    const eventKind =
      cypressStepTypesToEventTypes[step.name as keyof typeof cypressStepTypesToEventTypes];

    if (!eventKind) {
      // Shouldn't happen - the rendering logic _should_ make sure the step matches
      return;
    }

    const eventPoint: PointWithEventType = { ...step.annotations.start!, kind: eventKind };

    setJumpToCodeStatus("loading");
    const result = await dispatch(jumpToClickEventFunctionLocation(eventPoint, onSeek));
    setJumpToCodeStatus(result);

    if (result === "not_loaded") {
      // Clear this out after a few seconds since the user could change focus.
      // Simpler than trying to watch the focus region change over time.
      setTimeout(() => {
        setJumpToCodeStatus("not_checked");
      }, 5000);
    }
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
    if (autoSelect && ref.current && !autoSelectState.current) {
      autoSelectState.current = 1;
      onClick()
        .then(clicked => {
          if (clicked && ref.current) {
            autoSelectState.current = 2;
            scrollIntoView(ref.current);
          }
        })
        .catch(() => {
          autoSelectState.current = 0;
        });
    }
  }, [autoSelect, ref, onClick]);

  // This math is bananas don't look here until this is cleaned up :)
  const bump = state !== "pending" ? 10 : 0;
  const actualProgress = bump + 90 * ((currentTime - step.absoluteStartTime) / step.duration);
  const progress = actualProgress > 100 ? 100 : actualProgress;
  const displayedProgress =
    (step.duration === 1 && state === "paused") || progress == 100 ? 0 : progress;
  const isSelected = selectedStep?.id === id;
  const error = !!(step.error || info.getStepAsserts(step).some(s => !!s.error));

  // TODO This is very Cypress-specific. Playwright steps have a `name` like `locator.click("blah")`.
  // We only care about click events and keyboard events. Keyboard events appear to be a "type" command,
  // as in "type this text into the input".
  let shouldShowJumpToCode = false;
  if ("category" in step && step.annotations.start) {
    shouldShowJumpToCode =
      "category" in step &&
      step.category === "command" &&
      (step.name === "click" || step.name === "type");
  }

  return (
    <div className="flex-grow-1 flex w-full items-center justify-between">
      <TestStepRow
        active={state === "paused"}
        pending={state === "pending"}
        error={error}
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
          <div
            className={`flex flex-grow break-all font-medium ${
              state === "paused" ? "font-bold" : ""
            }`}
          >
            <div>{step.parentId ? <div className="w-4 opacity-0">|</div> : ""} </div>
            <div>
              <span className={`${styles.step} ${styles[step.name]}`}>{step.name}</span>
              <span className="opacity-70">{argString}</span>
            </div>
          </div>
        </button>
        <React.Suspense>
          <MatchingElementBadge selected={isSelected} step={step} />
        </React.Suspense>
        {step.alias ? (
          <span className={classNames("alias")} title={`'${argString}' aliased as '${step.alias}'`}>
            {step.alias}
          </span>
        ) : null}
      </TestStepRow>
      <Actions step={step} hovered={isSelected} selected={isSelected} />
      {shouldShowJumpToCode ? (
        <JumpToCodeButton
          onClick={onJumpToClickEvent}
          status={jumpToCodeStatus}
          currentExecutionPoint={executionPoint}
          targetExecutionPoint={step.annotations.start!.point}
        />
      ) : null}
    </div>
  );
}

function MatchingElementBadge({ step, selected }: { step: AnnotatedTestStep; selected: boolean }) {
  const client = useContext(ReplayClientContext);
  const shouldRenderRef = useRef(selected);

  if (step.name !== "get" || (!shouldRenderRef.current && !selected)) {
    return null;
  }

  shouldRenderRef.current = true;
  const { pauseId, consoleProps } = getCypressConsolePropsSuspense(client, step) || {};

  const count = consoleProps?.preview?.properties?.find(p => p.name === "Elements")?.value;

  if (!pauseId || !count || count < 1) {
    // maybe an error?
    return null;
  }

  return <span className={classNames("ElementBadge")}>{count}</span>;
}

function Actions({
  step,
  hovered,
  selected,
}: {
  step: AnnotatedTestStep;
  hovered: boolean;
  selected: boolean;
}) {
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
      data-testid="TestSuites-TestCase-TestStepRow-Actions"
      onClick={onClick}
      className={`${selected ? "" : "invisible"} group-hover/step:visible`}
    >
      <div className="flex items-center">
        <MaterialIcon>more_vert</MaterialIcon>
      </div>
    </button>
  );
}
