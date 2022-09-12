// Routines for managing and rendering graphics data fetched over the WRP.
import {
  getAllPaints,
  getPaintPointForTime,
  imperitavelyGetNextPaintPointForTime,
  imperitavelyGetPaintPointForTime,
  setFetchingPaints,
  Status,
} from "@bvaughn/src/suspense/PaintsCache";
import { preCacheExecutionPointForTime } from "@bvaughn/src/suspense/PointsCache";
import { TimeStampedPoint, MouseEvent, ScreenShot, PaintPoint } from "@replayio/protocol";
import { ReplayClient } from "shared/client/ReplayClient";
import { ReplayClientInterface } from "shared/client/types";

import { DownloadCancelledError, ScreenshotCache } from "./screenshot-cache";
import { ThreadFront } from "./thread";
import { assert, closerEntry, insertEntrySorted, mostRecentEntry, nextEntry } from "./utils";

declare global {
  interface Window {
    // we expose this for use in testing
    currentScreenshotHash?: string;
  }
}

export const screenshotCache = new ScreenshotCache();

const repaintedScreenshots: Map<string, ScreenShot> = new Map();

//////////////////////////////
// Paint / Mouse Event Points
//////////////////////////////

export interface TimeStampedPointWithPaintHash extends TimeStampedPoint {
  paintHash: string;
}

// All mouse events that have occurred in the recording, in order.
const gMouseEvents: MouseEvent[] = [];

// All mouse click events that have occurred in the recording, in order.
const gMouseClickEvents: MouseEvent[] = [];

// Device pixel ratio used by the current screenshot.
let gDevicePixelRatio = 1;

function onMouseEvents(events: MouseEvent[]) {
  if (typeof onPointsReceived === "function") {
    events.forEach(e => preCacheExecutionPointForTime(e));
    onPointsReceived(events);
  }

  events.forEach(entry => {
    insertEntrySorted(gMouseEvents, entry);
    if (entry.kind == "mousedown") {
      insertEntrySorted(gMouseClickEvents, entry);
    }
  });

  if (typeof onMouseDownEvents === "function") {
    onMouseDownEvents(gMouseClickEvents);
  }
}
export function setupGraphics(replayClient: ReplayClientInterface) {
  ThreadFront.sessionWaiter.promise.then(async (sessionId: string) => {
    const { client } = await import("./socket");
    client.Session.findMouseEvents({}, sessionId);
    client.Session.addMouseEventsListener(({ events }) => onMouseEvents(events));

    const recordingTarget = await ThreadFront.recordingTargetWaiter.promise;
    if (recordingTarget === "node") {
      setFetchingPaints(Status.Cancelled);
    } else {
      getAllPaints(replayClient);
    }
  });

  ThreadFront.on("paused", async ({ point, time }) => {
    let screen: ScreenShot | undefined;
    let mouse: MouseAndClickPosition | undefined;
    try {
      const rv = await getGraphicsAtTime(time);
      screen = rv.screen;
      mouse = rv.mouse;
    } catch (err) {
      if (err instanceof DownloadCancelledError) {
        return;
      }
      throw err;
    }

    if (point !== ThreadFront.currentPoint) {
      return;
    }
    if (screen) {
      paintGraphics(screen, mouse);
    }

    if (typeof onPausedAtTime === "function") {
      onPausedAtTime(time);
    }

    await repaint();
  });
}

export async function repaint(force = false) {
  const recordingCapabilities = await ThreadFront.getRecordingCapabilities();
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

  const { mouse } = await getGraphicsAtTime(ThreadFront.currentTime);
  const pause = ThreadFront.getCurrentPause();

  const rv = await pause.repaintGraphics(force);
  graphicsFetched = true;

  if (didStall) {
    if (typeof onPlaybackStatus === "function") {
      onPlaybackStatus(false);
    }
  }

  if (!rv || pause !== ThreadFront.currentPause) {
    return;
  }
  let { description, screenShot } = rv;
  if (screenShot) {
    repaintedScreenshots.set(description.hash, screenShot);
  } else {
    screenShot = repaintedScreenshots.get(description.hash);
    if (!screenShot) {
      console.error("Missing repainted screenshot", description);
      return;
    }
  }
  paintGraphics(screenShot, mouse);
}

export function mostRecentPaintOrMouseEvent(time: number) {
  const paintEntry = imperitavelyGetPaintPointForTime(time);
  const mouseEntry = mostRecentEntry(gMouseEvents, time);
  return closerEntry(time, paintEntry, mouseEntry);
}

export function nextPaintOrMouseEvent(time: number) {
  const paintEntry = imperitavelyGetNextPaintPointForTime(time);
  const mouseEntry = nextEntry(gMouseEvents, time);
  return closerEntry(time, paintEntry, mouseEntry);
}

export function getDevicePixelRatio() {
  return gDevicePixelRatio;
}

//////////////////////////////
// Paint Data Management
//////////////////////////////

function addScreenShot(screenShot: ScreenShot) {
  screenshotCache.addScreenshot(screenShot);
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
  forPlayback = false
): Promise<{ screen?: ScreenShot; mouse?: MouseAndClickPosition }> {
  const paint = imperitavelyGetPaintPointForTime(time);
  if (!paint) {
    // There are no graphics to paint here.
    return {};
  }

  if (!paint.paintHash) {
    return {};
  }

  const screen = await (forPlayback
    ? screenshotCache.getScreenshotForPlayback(paint)
    : screenshotCache.getScreenshotForPreview(paint));

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
  window.currentScreenshotHash = screenShot?.hash;
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
  const graphicsVideo = document.getElementById("graphicsVideo") as HTMLVideoElement;

  // Find an image to draw.
  let image = gLastImage;
  if (gDrawImage?.width && gDrawImage?.height) {
    image = gDrawImage;
  }

  canvas.style.visibility = "visible";
  const cx = canvas.getContext("2d")!;
  const bounds = calculateBounds(video.getBoundingClientRect(), image);

  if (bounds) {
    canvas.width = bounds.width;
    canvas.height = bounds.height;
    graphicsVideo.style.width = bounds.width + "px";
    graphicsVideo.style.height = bounds.height + "px";

    canvas.style.transform = graphicsVideo.style.transform = `scale(${bounds.scale})`;
    canvas.style.left = graphicsVideo.style.left = String(bounds.left) + "px";
    canvas.style.top = graphicsVideo.style.top = String(bounds.top) + "px";
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
export function setPausedAtTimeCallback(callback: typeof onPausedAtTime): void {
  onPausedAtTime = callback;
}

let onPlaybackStatus: (stalled: boolean) => void;
export function setPlaybackStatusCallback(callback: typeof onPlaybackStatus): void {
  onPlaybackStatus = callback;
}

let onPointsReceived: (points: TimeStampedPoint[]) => void;
export function setPointsReceivedCallback(callback: typeof onPointsReceived): void {
  onPointsReceived = callback;
}

let onRefreshGraphics: (canvas: Canvas) => void;
export function setRefreshGraphicsCallback(callback: typeof onRefreshGraphics): void {
  onRefreshGraphics = callback;
}

let onVideoUrl: (url: string) => void;
export function setVideoUrlCallback(callback: typeof onVideoUrl): void {
  onVideoUrl = callback;
}
