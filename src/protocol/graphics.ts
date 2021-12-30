// Routines for managing and rendering graphics data fetched over the WRP.

import { ThreadFront } from "./thread";
import { assert, binarySearch } from "./utils";
import { DownloadCancelledError, ScreenshotCache } from "./screenshot-cache";
import ResizeObserverPolyfill from "resize-observer-polyfill";
import {
  TimeStampedPoint,
  MouseEvent,
  paintPoints,
  ScreenShot,
  findPaintsResult,
} from "@recordreplay/protocol";
import { decode } from "base64-arraybuffer";
import { client } from "./socket";
import { UIStore, UIThunkAction } from "ui/actions";
import { Canvas } from "ui/state/app";
import { setCanvas, setEventsForType, setVideoUrl } from "ui/actions/app";
import { setPlaybackPrecachedTime, setPlaybackStalled } from "ui/actions/timeline";
import { getPlaybackPrecachedTime, getRecordingDuration } from "ui/reducers/timeline";
import { isRepaintEnabled } from "./enable-repaint";

const { features } = require("ui/utils/prefs");

export const screenshotCache = new ScreenshotCache();
const repaintedScreenshots: Map<string, ScreenShot> = new Map();

interface Timed {
  time: number;
}

// Given a sorted array of items with "time" properties, find the index of
// the most recent item at or preceding a given time.
function mostRecentIndex<T extends Timed>(array: T[], time: number): number | undefined {
  if (!array.length || time < array[0].time) {
    return undefined;
  }
  const index = binarySearch(0, array.length, (index: number) => {
    return time - array[index].time;
  });
  assert(array[index].time <= time);
  if (index + 1 < array.length) {
    assert(array[index + 1].time >= time);
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

export interface TimeStampedPointWithPaintHash extends TimeStampedPoint {
  paintHash: string;
}

// All paints that have occurred in the recording, in order. Include the
// beginning point of the recording as well, which is not painted and has
// a known point and time.
const gPaintPoints: TimeStampedPointWithPaintHash[] = [{ point: "0", time: 0, paintHash: "" }];

// All mouse events that have occurred in the recording, in order.
const gMouseEvents: MouseEvent[] = [];

// All mouse click events that have occurred in the recording, in order.
const gMouseClickEvents: MouseEvent[] = [];

// Device pixel ratio used by the current screenshot.
let gDevicePixelRatio = 1;

function onPaints({ paints }: paintPoints) {
  paints.forEach(({ point, time, screenShots }) => {
    const paintHash = screenShots.find(desc => desc.mimeType == "image/jpeg")!.hash;
    insertEntrySorted(gPaintPoints, { point, time, paintHash });
  });
}

function onMouseEvents(events: MouseEvent[], store: UIStore) {
  events.forEach(entry => {
    insertEntrySorted(gMouseEvents, entry);
    if (entry.kind == "mousedown") {
      insertEntrySorted(gMouseClickEvents, entry);
    }
  });

  store.dispatch(setEventsForType(gMouseClickEvents, "mousedown"));
}

class VideoPlayer {
  store: UIStore | null = null;
  video: HTMLVideoElement | null = null;
  all = new Uint8Array();
  blob?: Blob;
  videoReadyCallback?: (video: HTMLVideoElement) => any;
  commands?: Promise<void>;

  init(store: UIStore) {
    this.store = store;
    this.commands = Promise.resolve();
  }

  createUrl() {
    if (this.blob) {
      const url = URL.createObjectURL(this.blob);
      this.store?.dispatch(setVideoUrl(url));
    }
  }

  async append(fragment: string) {
    if (!fragment) {
      if (this.all) {
        this.blob = new Blob([this.all], { type: 'video/webm; codecs="vp9"' });
        this.createUrl();
      }
    } else {
      const buffer = decode(fragment);

      var tmp = new Uint8Array(this.all.byteLength + buffer.byteLength);
      tmp.set(new Uint8Array(this.all), 0);
      tmp.set(new Uint8Array(buffer), this.all.byteLength);
      this.all = tmp;
    }
  }

  seek(timeMs: number) {
    this.commands =
      this.commands &&
      this.commands.then(async () => {
        const video = this.store?.getState().app.videoNode;
        if (features.videoPlayback && video) {
          video.pause();
          video.currentTime = timeMs / 1000;
        }
      });
  }

  play() {
    this.commands =
      this.commands &&
      this.commands.then(() => {
        const video = this.store?.getState().app.videoNode;
        const currentTime = this.store?.getState().timeline.currentTime;
        if (features.videoPlayback && video) {
          video.currentTime = (currentTime || 0) / 1000;
          return video.play();
        }
      });
  }
}

export const Video = new VideoPlayer();

let onRefreshGraphics: (canvas: Canvas) => void;
let paintPointsWaiter: Promise<findPaintsResult>;

export function setupGraphics(store: UIStore) {
  onRefreshGraphics = (canvas: Canvas) => {
    store.dispatch(setCanvas(canvas));
  };

  Video.init(store);

  ThreadFront.sessionWaiter.promise.then((sessionId: string) => {
    paintPointsWaiter = client.Graphics.findPaints({}, sessionId);
    client.Graphics.addPaintPointsListener(onPaints);

    client.Session.findMouseEvents({}, sessionId);
    client.Session.addMouseEventsListener(({ events }) => onMouseEvents(events, store));

    if (features.videoPlayback) {
      client.Graphics.getPlaybackVideo({}, sessionId);
      client.Graphics.addPlaybackVideoFragmentListener(param => Video.append(param.fragment));
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

    store.dispatch(precacheScreenshots(time));

    if (!isRepaintEnabled()) {
      return;
    }

    await repaint();
  });
}

export async function repaint(force = false) {
  const { mouse } = await getGraphicsAtTime(ThreadFront.currentTime);
  const point = ThreadFront.currentPoint;
  await ThreadFront.ensureAllSources();
  if (point !== ThreadFront.currentPoint) {
    return;
  }
  ThreadFront.ensureCurrentPause();
  const pause = ThreadFront.currentPause;
  assert(pause);

  let graphicsFetched = false;
  // Show a stalled message if the graphics have not fetched after half a second
  setTimeout(() => !graphicsFetched && store.dispatch(setPlaybackStalled(true)), 500);
  const rv = await pause.repaintGraphics(force);
  graphicsFetched = true;
  store.dispatch(setPlaybackStalled(false));
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
  await paintPointsWaiter;
  const paintIndex = mostRecentIndex(gPaintPoints, time);
  if (paintIndex === undefined) {
    // There are no graphics to paint here.
    return {};
  }

  const { point, paintHash } = gPaintPoints[paintIndex];
  if (!paintHash) {
    return {};
  }

  const screenPromise = forPlayback
    ? features.videoPlayback
      ? Promise.resolve(undefined)
      : screenshotCache.getScreenshotForPlayback(point, paintHash)
    : screenshotCache.getScreenshotForPreview(point, paintHash);

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

export function paintGraphics(
  screenShot?: ScreenShot,
  mouse?: MouseAndClickPosition,
  playing?: boolean
) {
  if (!screenShot || (playing && features.videoPlayback)) {
    clearGraphics();
  } else {
    assert(screenShot.data);
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
    graphicsVideo.style.width = bounds.width + "px";
    graphicsVideo.style.height = bounds.height + "px";

    canvas.style.transform = graphicsVideo.style.transform = `scale(${bounds.scale})`;
    canvas.style.left = graphicsVideo.style.left = String(bounds.left) + "px";
    canvas.style.top = graphicsVideo.style.top = String(bounds.top) + "px";
    if (image) {
      cx.drawImage(image, 0, 0);
    }

    onRefreshGraphics({
      ...bounds,
      gDevicePixelRatio,
    });

    // Apply the same transforms to any displayed highlighter.
    const highlighterContainer = document.querySelector(".highlighter-container") as HTMLElement;
    if (highlighterContainer && gDevicePixelRatio) {
      highlighterContainer.style.transform = `scale(${bounds.scale * gDevicePixelRatio})`;
      highlighterContainer.style.left = `${bounds.left}px`;
      highlighterContainer.style.top = `${bounds.top}px`;
      highlighterContainer.style.width = `${bounds.width}px`;
      highlighterContainer.style.height = `${bounds.height}px`;
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
    const observer = new ResizeObserverPolyfill(() => {
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

export async function getFirstMeaningfulPaint(limit: number = 10) {
  await paintPointsWaiter;
  for (const paintPoint of gPaintPoints.slice(0, limit)) {
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

// precache this many milliseconds
const precacheTime = 5000;
// startTime of the currently running precacheScreenshots() call
let precacheStartTime = -1;

export function precacheScreenshots(startTime: number): UIThunkAction {
  return async ({ dispatch, getState }) => {
    await paintPointsWaiter;

    const recordingDuration = getRecordingDuration(getState());
    if (!recordingDuration) {
      return;
    }

    startTime = snapTimeForPlayback(startTime);
    if (startTime === precacheStartTime) {
      return;
    }
    if (startTime < precacheStartTime) {
      dispatch(setPlaybackPrecachedTime(startTime));
    }
    precacheStartTime = startTime;

    const endTime = Math.min(startTime + precacheTime, recordingDuration);
    for (let time = startTime; time < endTime; time += snapInterval) {
      const index = mostRecentIndex(gPaintPoints, time);
      if (index === undefined) {
        return;
      }

      const paintHash = gPaintPoints[index].paintHash;
      if (!screenshotCache.hasScreenshot(paintHash)) {
        const graphicsPromise = getGraphicsAtTime(time, true);

        const precachedTime = Math.max(time - snapInterval, startTime);
        if (precachedTime > getPlaybackPrecachedTime(getState())) {
          dispatch(setPlaybackPrecachedTime(precachedTime));
        }

        await graphicsPromise;

        if (precacheStartTime !== startTime) {
          return;
        }
      }
    }

    let precachedTime = endTime;
    if (mostRecentIndex(gPaintPoints, precachedTime) === gPaintPoints.length - 1) {
      precachedTime = recordingDuration;
    }
    if (precachedTime > getPlaybackPrecachedTime(getState())) {
      dispatch(setPlaybackPrecachedTime(precachedTime));
    }
  };
}

// Snap time to 50ms intervals, snapping up.
const snapInterval = 50;
export function snapTimeForPlayback(time: number) {
  return time + snapInterval - (time % snapInterval);
}
