// Routines for managing and rendering graphics data fetched over the WRP.
import { MouseEvent, ScreenShot } from "@replayio/protocol";

import {
  getExecutionPoint,
  getPauseId,
  getTime,
  paused,
} from "devtools/client/debugger/src/reducers/pause";
import { PaintsCache, timeIsBeyondKnownPaints } from "protocol/PaintsCache";
import { RecordedMouseEventsCache } from "protocol/RecordedEventsCache";
import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import { screenshotCache } from "replay-next/src/suspense/ScreenshotCache";
import { replayClient } from "shared/client/ReplayClientContext";
import { TimeStampedPointWithPaintHash } from "shared/client/types";
import { startAppListening } from "ui/setup/listenerMiddleware";
import { AppStore } from "ui/setup/store";
import { getCurrentPauseId } from "ui/utils/app";

import { repaintGraphics } from "./repainted-graphics-cache";
import { assert, binarySearch, defer } from "./utils";

const repaintedScreenshots: Map<string, ScreenShot> = new Map();

interface Timed {
  time: number;
}

// Given a sorted array of items with "time" properties, find the index of
// the most recent item at or preceding a given time.
export function mostRecentIndex<T extends Timed>(array: T[], time: number): number | undefined {
  if (!array.length || time < array[0].time) {
    return undefined;
  }
  const index = binarySearch(0, array.length, (index: number) => {
    return time - array[index].time;
  });
  assert(
    array[index].time <= time,
    "The most recent item should be at or preceding the given time"
  );
  if (index + 1 < array.length) {
    assert(array[index + 1].time >= time, "the most recent item's index should be in the array");
  }
  return index;
}

function mostRecentEntry<T extends Timed>(array: T[], time: number) {
  const index = mostRecentIndex(array, time);
  return index !== undefined ? array[index] : null;
}

function nextEntry<T extends Timed>(array: T[], time: number) {
  const index = mostRecentIndex(array, time);
  if (index === undefined) {
    return array.length ? array[0] : null;
  }
  return index + 1 < array.length ? array[index + 1] : null;
}

// Add an entry with a "time" property to an array that is sorted by time.
function insertEntrySorted<T extends Timed>(array: T[], entry: T) {
  if (!array.length || array[array.length - 1].time <= entry.time) {
    array.push(entry);
  } else {
    const index = mostRecentIndex(array, entry.time);
    if (index !== undefined) {
      array.splice(index + 1, 0, entry);
    } else {
      array.unshift(entry);
    }
  }
}

function closerEntry<T1 extends Timed, T2 extends Timed>(
  time: number,
  entry1: T1 | null,
  entry2: T2 | null
) {
  if (!entry1) {
    return entry2;
  }
  if (!entry2) {
    return entry1;
  }
  if (Math.abs(time - entry1.time) < Math.abs(time - entry2.time)) {
    return entry1;
  }
  return entry2;
}

//////////////////////////////
// Paint / Mouse Event Points
//////////////////////////////

// TODO [FE-2104] Delete these arrays
export const gPaintPoints: TimeStampedPointWithPaintHash[] = [
  { point: "0", time: 0, paintHash: "" },
];
const gMouseEvents: MouseEvent[] = [];
const gMouseClickEvents: MouseEvent[] = [];

// Device pixel ratio used by the current screenshot.
let gDevicePixelRatio = 1;

export async function setupGraphics(store: AppStore) {
  await Promise.all([PaintsCache.readAsync(), RecordedMouseEventsCache.readAsync()]);

  // TODO [FE-2104] Remove gPaintPoints entirely
  gPaintPoints.push(...PaintsCache.getValue());

  // TODO [FE-2104] Remove gMouseEvents and gMouseClickEvents entirely
  RecordedMouseEventsCache.getValue().forEach(entry => {
    gMouseEvents.push(entry);
    if (entry.kind == "mousedown") {
      gMouseClickEvents.push(entry);
    }
  });

  // TODO [FE-2104] Remove this callback
  if (typeof onMouseDownEvents === "function") {
    onMouseDownEvents(gMouseClickEvents);
  }

  const currentTime = getTime(store.getState());
  const { screen, mouse } = await getGraphicsAtTime(currentTime, false);
  if (screen) {
    paintGraphics(screen, mouse);
  }

  async function repaint() {
    const state = store.getState();
    repaintAtPause(
      getTime(state),
      await getCurrentPauseId(replayClient, state),
      (_time, pauseId) => {
        return pauseId !== getPauseId(store.getState());
      },
      false
    );
  }

  startAppListening({
    actionCreator: paused,
    effect: async ({ payload: { executionPoint, time } }) => {
      const { screen, mouse } = await getGraphicsAtTime(time);

      if (executionPoint !== getExecutionPoint(store.getState())) {
        return;
      }
      if (screen) {
        paintGraphics(screen, mouse);
      }

      if (typeof onPausedAtTime === "function") {
        onPausedAtTime(time);
      }

      await repaint();
    },
  });
}

export async function fetchScreenshotForPause(pauseId: string, force = false) {
  const recordingCapabilities = await recordingCapabilitiesCache.readAsync(replayClient);
  if (!recordingCapabilities.supportsRepaintingGraphics) {
    return;
  }

  let graphicsFetched = false;

  let didStall = false;
  setTimeout(() => {
    if (!graphicsFetched) {
      didStall = true;

      if (typeof onPlaybackStatus === "function") {
        onPlaybackStatus(true);
      }
    }
  }, 500);

  const rv = await repaintGraphics(replayClient, pauseId, force);
  graphicsFetched = true;

  if (didStall) {
    if (typeof onPlaybackStatus === "function") {
      onPlaybackStatus(false);
    }
  }

  if (!rv) {
    return;
  }

  let { description, screenShot } = rv;
  if (screenShot) {
    repaintedScreenshots.set(description.hash, screenShot);
  } else {
    screenShot = repaintedScreenshots.get(description.hash);
    if (!screenShot) {
      console.error("Missing repainted screenshot", description);
    }
  }

  return screenShot;
}

export async function repaintAtPause(
  time: number,
  pauseId: string,
  shouldCancelRepaint: (time: number, pauseId: string) => boolean,
  force = false
) {
  const screenshot = await fetchScreenshotForPause(pauseId, force);

  if (screenshot && !shouldCancelRepaint(time, pauseId)) {
    const { mouse } = await getGraphicsAtTime(time);
    paintGraphics(screenshot, mouse);

    return screenshot;
  }
}

export async function addScreenForPoint(point: string, time: number) {
  const pauseResult = await replayClient.createPause(point);
  const screenshot = await fetchScreenshotForPause(pauseResult.pauseId);

  if (screenshot) {
    addLastScreen(screenshot, point, time);

    return screenshot;
  }
}

export function addLastScreen(screen: ScreenShot | null, point: string, time: number) {
  if (screen) {
    addScreenShot(screen);
    const paintHash = screen.hash;
    insertEntrySorted(gPaintPoints, { point, time, paintHash });
  }
}

export function mostRecentPaintOrMouseEvent(time: number) {
  const paintEntry = mostRecentEntry(gPaintPoints, time);
  const mouseEntry = mostRecentEntry(gMouseEvents, time);
  return closerEntry(time, paintEntry, mouseEntry);
}

export function nextPaintOrMouseEvent(time: number) {
  const paintEntry = nextEntry(gPaintPoints, time);
  const mouseEntry = nextEntry(gMouseEvents, time);
  return closerEntry(time, paintEntry, mouseEntry);
}

export function nextPaintEvent(time: number) {
  return nextEntry(gPaintPoints, time);
}

export function previousPaintEvent(time: number) {
  const entry = mostRecentEntry(gPaintPoints, time);
  if (entry && entry.time == time) {
    return mostRecentEntry(gPaintPoints, time - 1);
  }
  return entry;
}

export function getMostRecentPaintPoint(time: number) {
  return mostRecentEntry(gPaintPoints, time);
}

export function getClosestPaintPoint(time: number) {
  const entryBefore = mostRecentEntry(gPaintPoints, time);
  const entryAfter = nextEntry(gPaintPoints, time);
  return closerEntry(time, entryBefore, entryAfter);
}

export function getDevicePixelRatio() {
  return gDevicePixelRatio;
}

//////////////////////////////
// Paint Data Management
//////////////////////////////

function addScreenShot(screenShot: ScreenShot) {
  // the point isn't used in the cache key, so it's OK to pass a dummy value here
  screenshotCache.cache(screenShot, replayClient, "", screenShot.hash);
}

// How recently a click must have occurred for it to be drawn.
const ClickThresholdMs = 200;

export interface MouseAndClickPosition {
  x: number;
  y: number;
  clickX?: number;
  clickY?: number;
}

export async function getGraphicsAtTime(
  time: number,
  forPlayback = false,
  allowLastPaint = false
): Promise<{ screen?: ScreenShot; mouse?: MouseAndClickPosition }> {
  const paintIndex = mostRecentIndex(gPaintPoints, time);
  if (paintIndex === undefined || (timeIsBeyondKnownPaints(time) && !allowLastPaint)) {
    // There are no graphics to paint here.
    return {};
  }

  const { point, paintHash } = gPaintPoints[paintIndex];
  if (!paintHash) {
    return {};
  }

  const screenPromise = screenshotCache.readAsync(replayClient, point, paintHash);

  const screen = await screenPromise;

  let mouse: MouseAndClickPosition | undefined;
  const mouseEvent = mostRecentEntry(gMouseEvents, time);
  if (mouseEvent) {
    mouse = { x: mouseEvent.clientX, y: mouseEvent.clientY };
    const clickEvent = mostRecentEntry(gMouseClickEvents, time);
    if (clickEvent && clickEvent.time + ClickThresholdMs >= time) {
      mouse.clickX = clickEvent.clientX;
      mouse.clickY = clickEvent.clientY;
    }
  }

  return { screen, mouse };
}

//////////////////////////////
// Rendering State
//////////////////////////////

// Image to draw, if any.
let gDrawImage: HTMLImageElement | null = null;

// Last image we were drawing, if any. This continues to be painted until the
// current image loads.
let gLastImage: HTMLImageElement | null = null;

// Caching last image bounds
let gLastBounds: {
  height: number;
  width: number;
  left: number;
  top: number;
  scale: number;
} | null = null;

// Mouse information to draw.
let gDrawMouse: MouseAndClickPosition | null = null;

export function paintGraphics(screenShot?: ScreenShot, mouse?: MouseAndClickPosition) {
  if (!screenShot) {
    clearGraphics();
  } else {
    assert(screenShot.data, "no screenshot data");
    addScreenShot(screenShot);
    if (gDrawImage && gDrawImage.width && gDrawImage.height) {
      gLastImage = gDrawImage;
    }
    gDrawImage = new Image();
    gDrawImage.onload = refreshGraphics;
    gDrawImage.src = `data:${screenShot.mimeType};base64,${screenShot.data}`;
  }
  gDrawMouse = mouse || null;
  gDevicePixelRatio = screenShot?.scale || 1;
  refreshGraphics();
}

function clearGraphics() {
  // Keeping gLastImage around to use it as a fallback for video sizing
  gDrawImage = null;
  gDrawMouse = null;
  refreshGraphics();
}

function drawCursor(cx: CanvasRenderingContext2D, x: number, y: number) {
  const scale = 1.5 * (gDevicePixelRatio || 1);
  const path = new Path2D(`
M ${x} ${y}
V ${y + 10 * scale}
L ${x + 2 * scale} ${y + 8 * scale}
L ${x + 4 * scale} ${y + 13 * scale}
L ${x + 5.5 * scale} ${y + 12.6 * scale}
L ${x + 3.5 * scale} ${y + 7.6 * scale}
L ${x + 6.5 * scale} ${y + 7.8 * scale}
Z
`);
  cx.fillStyle = "black";
  cx.fill(path);
  cx.strokeStyle = "white";
  cx.lineWidth = 1;
  cx.stroke(path);
}

function drawClick(cx: CanvasRenderingContext2D, x: number, y: number) {
  const scale = gDevicePixelRatio || 1;
  cx.strokeStyle = "black";
  cx.lineWidth = 3;
  cx.beginPath();
  cx.arc(x, y, 25 * scale, 0, 2 * Math.PI);
  cx.stroke();
}

function calculateBounds(containerBounds: DOMRect, image: HTMLImageElement | null | undefined) {
  const maxScale = 1 / (gDevicePixelRatio || 1);
  let bounds = { height: 0, width: 0, left: 0, top: 0, scale: 1 };

  if (image && image.width > 0 && image.height > 0) {
    bounds.width = image.width;
    bounds.height = image.height;
  } else {
    return gLastBounds || bounds;
  }

  bounds.scale = Math.min(
    containerBounds.width / bounds.width,
    containerBounds.height / bounds.height,
    maxScale
  );

  const drawWidth = bounds.width * bounds.scale;
  const drawHeight = bounds.height * bounds.scale;
  bounds.left = (containerBounds.width - drawWidth) / 2;
  bounds.top = (containerBounds.height - drawHeight) / 2;

  gLastBounds = bounds;
  return bounds;
}

export function refreshGraphics() {
  const video = document.getElementById("video");
  if (!video) {
    return;
  }

  const canvas = document.getElementById("graphics") as HTMLCanvasElement;

  // Find an image to draw.
  let image;
  if (gDrawImage) {
    image = gDrawImage;
    if (!image.width || !image.height) {
      // The current image hasn't loaded yet.
      image = gLastImage;
    }
  }

  canvas.style.visibility = "visible";
  const cx = canvas.getContext("2d")!;
  const bounds = calculateBounds(video.getBoundingClientRect(), image);

  if (bounds) {
    canvas.width = bounds.width;
    canvas.height = bounds.height;

    canvas.style.transform = `scale(${bounds.scale})`;
    canvas.style.left = String(bounds.left) + "px";
    canvas.style.top = String(bounds.top) + "px";
    if (image) {
      cx.drawImage(image, 0, 0);
    }

    if (typeof onRefreshGraphics === "function") {
      onRefreshGraphics({
        ...bounds,
        gDevicePixelRatio,
      });
    }
  } else {
    cx.clearRect(0, 0, canvas.width, canvas.height);
  }

  if (gDrawMouse) {
    const { x, y, clickX, clickY } = gDrawMouse;
    drawCursor(cx, x, y);
    if (clickX !== undefined) {
      drawClick(cx, x, y);
    }
  }
}

// Install an observer to refresh graphics whenever the content canvas is resized.
export function installObserver() {
  const canvas = document.getElementById("video");
  if (canvas) {
    refreshGraphics();
    const observer = new ResizeObserver(() => {
      refreshGraphics();
    });
    observer.observe(canvas);
  } else {
    setTimeout(installObserver, 100);
  }
}

async function getScreenshotDimensions(screen: ScreenShot) {
  const img = new Image();
  await new Promise(resolve => {
    img.onload = resolve;
    img.src = `data:${screen.mimeType};base64,${screen.data}`;
  });
  return { width: img.width, height: img.height };
}

// the maximum number of paints to be considered when looking for the first meaningful paint
const INITIAL_PAINT_COUNT = 10;

export async function getFirstMeaningfulPaint() {
  await PaintsCache.readAsync();

  for (const paintPoint of gPaintPoints.slice(0, INITIAL_PAINT_COUNT)) {
    const { screen } = await getGraphicsAtTime(paintPoint.time);
    if (!screen) {
      continue;
    }

    const { width, height } = await getScreenshotDimensions(screen);
    if (screen.data.length > (width * height) / 40) {
      return paintPoint;
    }
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////
// The callbacks below allow external code to observe specific events.
// This design pattern is a short term strategy to remove external imports from this package.
//
// TODO We should revisit this as part of a larger architectural redesign (#6932).
////////////////////////////////////////////////////////////////////////////////////////////////

export interface Canvas {
  gDevicePixelRatio: number;
  height: number;
  left: number;
  scale: number;
  top: number;
  width: number;
}

let onMouseDownEvents: (events: MouseEvent[]) => void;
export function setMouseDownEventsCallback(callback: typeof onMouseDownEvents): void {
  onMouseDownEvents = callback;
}

let onPausedAtTime: (time: number) => void;
export function setPausedonPausedAtTimeCallback(callback: typeof onPausedAtTime): void {
  onPausedAtTime = callback;
}

let onPlaybackStatus: (stalled: boolean) => void;
export function setPlaybackStatusCallback(callback: typeof onPlaybackStatus): void {
  onPlaybackStatus = callback;
}

let onRefreshGraphics: (canvas: Canvas) => void;
export function setRefreshGraphicsCallback(callback: typeof onRefreshGraphics): void {
  onRefreshGraphics = callback;
}
