// Routines for managing and rendering graphics data fetched over the WRP.

const { ThreadFront } = require("./thread");
const { sendMessage, addEventListener, log } = require("./socket");
const { assert, binarySearch, defer } = require("./utils");
const { ScreenshotCache } = require("./screenshot-cache");
const screenshotCache = new ScreenshotCache();
const ResizeObserverPolyfill = require("resize-observer-polyfill").default;

// Given a sorted array of items with "time" properties, find the index of
// the most recent item at or preceding a given time.
function mostRecentIndex(array, time) {
  if (!array.length || time < array[0].time) {
    return undefined;
  }
  const index = binarySearch(0, array.length, index => {
    return time - array[index].time;
  });
  assert(array[index].time <= time);
  if (index + 1 < array.length) {
    assert(array[index + 1].time >= time);
  }
  return index;
}

function mostRecentEntry(array, time) {
  const index = mostRecentIndex(array, time);
  return index !== undefined ? array[index] : null;
}

function nextEntry(array, time) {
  const index = mostRecentIndex(array, time);
  if (index === undefined) {
    return array.length ? array[0] : null;
  }
  return index + 1 < array.length ? array[index + 1] : null;
}

// Add an entry with a "time" property to an array that is sorted by time.
function insertEntrySorted(array, entry) {
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

function closerEntry(time, entry1, entry2) {
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

// All paints that have occurred in the recording, in order. Include the
// beginning point of the recording as well, which is not painted and has
// a known point and time.
const gPaintPoints = [{ point: "0", time: 0 }];

// All mouse events that have occurred in the recording, in order.
const gMouseEvents = [];

// All mouse click events that have occurred in the recording, in order.
const gMouseClickEvents = [];

// Device pixel ratio used by recording screen shots.
let gDevicePixelRatio;

function onPaints({ paints }) {
  paints.forEach(({ point, time, screenShots }) => {
    const paintHash = screenShots.find(desc => desc.mimeType == "image/jpeg").hash;
    insertEntrySorted(gPaintPoints, { point, time, paintHash });
  });
}

function onMouseEvents({ events }) {
  events.forEach(entry => {
    insertEntrySorted(gMouseEvents, entry);
    if (entry.kind == "mousedown") {
      insertEntrySorted(gMouseClickEvents, entry);
    }
  });
}

ThreadFront.sessionWaiter.promise.then(sessionId => {
  sendMessage("Graphics.findPaints", {}, sessionId);
  addEventListener("Graphics.paintPoints", onPaints);

  sendMessage("Session.findMouseEvents", {}, sessionId);
  addEventListener("Session.mouseEvents", onMouseEvents);

  sendMessage("Graphics.getDevicePixelRatio", {}, sessionId).then(({ ratio }) => {
    gDevicePixelRatio = ratio;
  });
});

function addLastScreen(screen, point, time) {
  let paintHash;
  if (screen) {
    addScreenShot(screen);
    paintHash = screen.hash;
  }
  insertEntrySorted(gPaintPoints, { point, time, paintHash });
}

function mostRecentPaintOrMouseEvent(time) {
  const paintEntry = mostRecentEntry(gPaintPoints, time);
  const mouseEntry = mostRecentEntry(gMouseEvents, time);
  return closerEntry(time, paintEntry, mouseEntry);
}

function nextPaintOrMouseEvent(time) {
  const paintEntry = nextEntry(gPaintPoints, time);
  const mouseEntry = nextEntry(gMouseEvents, time);
  return closerEntry(time, paintEntry, mouseEntry);
}

function nextPaintEvent(time) {
  return nextEntry(gPaintPoints, time);
}

function previousPaintEvent(time) {
  const entry = mostRecentEntry(gPaintPoints, time);
  if (entry && entry.time == time) {
    return mostRecentEntry(gPaintPoints, time - 1);
  }
  return entry;
}

function getMostRecentPaintPoint(time) {
  return mostRecentEntry(gPaintPoints, time);
}

function getClosestPaintPoint(time) {
  const entryBefore = mostRecentEntry(gPaintPoints, time);
  const entryAfter = nextEntry(gPaintPoints, time);
  return closerEntry(time, entryBefore, entryAfter);
}

function getDevicePixelRatio() {
  return gDevicePixelRatio;
}

//////////////////////////////
// Paint Data Management
//////////////////////////////

function addScreenShot(screenShot) {
  screenshotCache.addScreenshot(screenShot);
}

// How recently a click must have occurred for it to be drawn.
const ClickThresholdMs = 200;

async function getGraphicsAtTime(time) {
  const paintIndex = mostRecentIndex(gPaintPoints, time);
  const { point, paintHash } = gPaintPoints[paintIndex] || {};

  if (paintHash === undefined) {
    // There are no graphics to paint here.
    return {};
  }

  const screenPromise = screenshotCache.getScreenshotForPlayback(point, paintHash);

  // Start loading graphics at nearby points.
  for (let i = paintIndex; i < paintIndex + 5 && i < gPaintPoints.length; i++) {
    const { point, paintHash } = gPaintPoints[i];
    screenshotCache.getScreenshotForPlayback(point, paintHash);
  }

  const screen = await screenPromise;

  let mouse;
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
let gDrawImage;

// Last image we were drawing, if any. This continues to be painted until the
// current image loads.
let gLastImage;

// Mouse information to draw.
let gDrawMouse;

function paintGraphics(screenShot, mouse) {
  if (!screenShot) {
    clearGraphics();
    return;
  }
  assert(screenShot.data);
  addScreenShot(screenShot);
  if (gDrawImage && gDrawImage.width && gDrawImage.height) {
    gLastImage = gDrawImage;
  }
  gDrawImage = new Image();
  gDrawImage.onload = refreshGraphics;
  gDrawImage.src = `data:${screenShot.mimeType};base64,${screenShot.data}`;
  gDrawMouse = mouse;
  refreshGraphics();
}

function clearGraphics() {
  gDrawImage = null;
  gLastImage = null;
  gDrawMouse = null;
  refreshGraphics();
}

function drawCursor(cx, x, y) {
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

function drawClick(cx, x, y) {
  const scale = gDevicePixelRatio || 1;
  cx.strokeStyle = "black";
  cx.lineWidth = 3;
  cx.beginPath();
  cx.arc(x, y, 25 * scale, 0, 2 * Math.PI);
  cx.stroke();
}

function refreshGraphics() {
  const viewer = document.getElementById("viewer");
  if (!viewer) {
    return;
  }

  const bounds = viewer.getBoundingClientRect();
  const canvas = document.getElementById("graphics");

  // Find an image to draw.
  let image;
  if (gDrawImage) {
    image = gDrawImage;
    if (!image.width || !image.height) {
      // The current image hasn't loaded yet.
      image = gLastImage;
    }
  }

  if (!image) {
    return;
  }

  canvas.style.visibility = "visible";

  const maxScale = 1 / (gDevicePixelRatio || 1);
  const scale = Math.min(bounds.width / image.width, bounds.height / image.height, maxScale);

  canvas.width = image.width;
  canvas.height = image.height;
  canvas.style.transform = `scale(${scale})`;

  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetLeft = (bounds.width - drawWidth) / 2;
  const offsetTop = (bounds.height - drawHeight) / 2;

  canvas.style.left = offsetLeft;
  canvas.style.top = offsetTop;

  const cx = canvas.getContext("2d");
  cx.drawImage(image, 0, 0);

  if (gDrawMouse) {
    const { x, y, clickX, clickY } = gDrawMouse;
    drawCursor(cx, x, y);
    if (clickX !== undefined) {
      drawClick(cx, x, y);
    }
  }

  // Apply the same transforms to any displayed highlighter.
  const highlighterContainer = document.querySelector(".highlighter-container");
  if (highlighterContainer && gDevicePixelRatio) {
    highlighterContainer.style.transform = `scale(${scale * gDevicePixelRatio})`;
    highlighterContainer.style.left = offsetLeft;
    highlighterContainer.style.top = offsetTop;
    highlighterContainer.style.width = image.width;
    highlighterContainer.style.height = image.height;
  }
}

// Install an observer to refresh graphics whenever the content canvas is resized.
function installObserver() {
  const canvas = document.getElementById("viewer");
  if (canvas) {
    const observer = new ResizeObserverPolyfill(() => {
      refreshGraphics();
    });
    observer.observe(canvas);
  } else {
    setTimeout(installObserver, 100);
  }
}
installObserver();

module.exports = {
  screenshotCache,
  addLastScreen,
  mostRecentPaintOrMouseEvent,
  nextPaintOrMouseEvent,
  nextPaintEvent,
  previousPaintEvent,
  paintGraphics,
  getGraphicsAtTime,
  getMostRecentPaintPoint,
  refreshGraphics,
  getDevicePixelRatio,
  getClosestPaintPoint,
};
