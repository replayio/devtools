import { compareNumericStrings } from "replay-next/src/utils/string";
import { AnnotatedTestStep } from "shared/graphql/types";
import { getCurrentPoint } from "ui/actions/app";
import {
  getCurrentTime,
  isDragging as isDraggingSelector,
  isPlaying as isPlayingSelector,
} from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

export function isStepStart(step: AnnotatedTestStep, time: number, point: string | null) {
  const { timeRange, pointRange } = getStepRanges(step);

  if (pointRange && point) {
    return pointRange[0] === point;
  } else if (timeRange) {
    return timeRange[0] === time;
  }

  return false;
}

export function isStepEnd(step: AnnotatedTestStep, time: number, point: string | null) {
  const { timeRange, pointRange } = getStepRanges(step);

  if (pointRange && point) {
    return pointRange[1] === point;
  } else if (timeRange) {
    return timeRange[1] === time;
  }

  return false;
}
export function getStepRanges(step: AnnotatedTestStep) {
  const { point: pointEnd } = step.annotations.end || {};
  const { point: pointStart } = step.annotations.start || {};

  const pointRange = [pointStart, pointEnd];
  const timeRange = [step.absoluteStartTime, step.absoluteEndTime];

  if (step.name === "assert") {
    if (step.error) {
      pointRange[0] = pointRange[1];
      timeRange[0] = timeRange[1];
    } else {
      pointRange[1] = pointRange[0];
      timeRange[1] = timeRange[0];
    }
  }

  return {
    timeRange: step.relativeStartTime ? timeRange : undefined,
    pointRange: pointRange.every((s): s is string => !!s) ? pointRange : undefined,
  };
}

export function useStepState(step: AnnotatedTestStep) {
  const currentTime = useAppSelector(getCurrentTime);
  const currentPoint = useAppSelector(getCurrentPoint);
  const isPlaying = useAppSelector(isPlayingSelector);
  const isDragging = useAppSelector(isDraggingSelector);

  const { timeRange, pointRange } = getStepRanges(step);
  let isPast = false;
  let isPaused = false;

  if (!timeRange) {
    return "pending";
  } else if (isPlaying || isDragging || !currentPoint || !pointRange) {
    isPast = currentTime > timeRange[0];
    isPaused = currentTime >= timeRange[0] && currentTime < timeRange[1];
  } else {
    isPast = compareNumericStrings(currentPoint, pointRange[0]) > 0;
    isPaused =
      compareNumericStrings(currentPoint, pointRange[0]) >= 0 &&
      compareNumericStrings(currentPoint, pointRange[1]) <= 0;
  }

  if (isPaused) {
    return "paused";
  } else if (isPast) {
    return "past";
  }

  return "pending";
}
