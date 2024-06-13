// The recording graphics (screenshots) are global state; there is only one rendered (in the DOM) at any point in time
// Although declarative (React) components render the graphics elements (e.g. comments, DOM highlights, recorded cursor)
// it is better for performance if imperative code (re)positions these elements,
// otherwise there may be "render lag" when windows are resized.
//
// This module exports a subscribe method for that imperative positioning logic,
// and an accompanying update method for notifying subscribers.
//
// This module also exports the global/mutable state directly, in case other imperative code requires it for single use purposes,
// e.g. calculate relative position information from a MouseEvent.
//
// This approach is unusual, but it's arguably cleaner than sharing these values via the DOM.

import { ExecutionPoint, ScreenShot } from "@replayio/protocol";

import { fitImageToContainer, getDimensions } from "replay-next/src/utils/image";
import { shallowEqual } from "shared/utils/compare";
import { createState } from "ui/components/Video/imperative/createState";

interface Rect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export type Status = "failed" | "loaded" | "loading";
export type ScreenShotType = "cached-paint" | "repaint";

export interface State {
  currentExecutionPoint: ExecutionPoint | null;
  currentTime: number;
  graphicsRect: Rect;
  localScale: number;
  recordingScale: number;
  screenShot: ScreenShot | undefined;
  screenShotType: ScreenShotType | undefined;
  status: Status;
}

export const state = createState<State>({
  currentExecutionPoint: null,
  currentTime: 0,
  graphicsRect: {
    height: 0,
    left: 0,
    top: 0,
    width: 0,
  },
  localScale: 1,
  recordingScale: 1,
  screenShot: undefined,
  screenShotType: undefined,
  status: "loading",
});

let lock: Object | null = null;

export async function updateState(
  graphicsElement: HTMLElement,
  options: Partial<{
    didResize?: boolean;
    executionPoint: ExecutionPoint | null;
    screenShot: ScreenShot | null;
    screenShotType: ScreenShotType | null;
    status: Status;
    time: number;
  }> = {}
) {
  const prevState = state.read();

  let {
    didResize,
    executionPoint = prevState.currentExecutionPoint,
    screenShot = prevState.screenShot,
    screenShotType = prevState.screenShotType,
    status = prevState.status,
    time = prevState.currentTime,
  } = options;

  if (shallowEqual(options, { didResize })) {
    if (lock !== null) {
      // Don't let an event from the ResizeObserver interrupt an in-progress update;
      // this should override new SnapShot data
      return;
    }
  }

  const localLock = new Object();
  lock = localLock;

  let graphicsRect = prevState.graphicsRect;
  let localScale = prevState.localScale;
  let recordingScale = prevState.recordingScale;
  if (screenShot && (screenShot != prevState.screenShot || didResize)) {
    const naturalDimensions = await getDimensions(screenShot.data, screenShot.mimeType);
    if (lock !== localLock) {
      return;
    }

    const naturalHeight = naturalDimensions.height;
    const naturalWidth = naturalDimensions.width;

    const containerRect = graphicsElement.getBoundingClientRect();
    const scaledDimensions = fitImageToContainer({
      containerHeight: containerRect.height,
      containerWidth: containerRect.width,
      imageHeight: naturalHeight,
      imageWidth: naturalWidth,
    });

    const clientHeight = scaledDimensions.height;
    const clientWidth = scaledDimensions.width;

    localScale = clientWidth / naturalWidth;
    recordingScale = screenShot.scale;

    graphicsRect = {
      height: clientHeight,
      left: containerRect.left + (containerRect.width - clientWidth) / 2,
      top: containerRect.top + (containerRect.height - clientHeight) / 2,
      width: clientWidth,
    };
  }

  const nextState: State = {
    currentExecutionPoint: executionPoint,
    currentTime: time,
    graphicsRect,
    localScale,
    recordingScale,
    screenShot: screenShot || undefined,
    screenShotType: screenShotType || undefined,
    status,
  };

  if (!shallowEqual(prevState, nextState)) {
    state.update(nextState);
  }

  lock = null;
}
