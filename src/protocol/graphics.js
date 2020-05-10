/*
BSD 3-Clause License

Copyright (c) 2020, Web Replay LLC
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// Routines for managing and rendering graphics data fetched over the WRP.

const { ThreadFront } = require("./thread");
const { sendMessage, addEventListener, log } = require("./socket");
const { assert, binarySearch } = require("./utils");

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
  return (index !== undefined) ? array[index] : null;
}

// Add an entry with a "time" property to an array that is sorted by time.
function insertEntrySorted(array, entry) {
  if (!array.length || array[array.length - 1].time <= entry.time) {
    array.push(entry);
  } else {
    const index = mostRecentIndex(gPaintPoints, entry.time);
    if (index !== undefined) {
      array.splice(index + 1, 0, entry);
    } else {
      array.unshift(entry);
    }
  }
}

function distance(time1, time2) {
  return Math.abs(time1 - time2);
}

// Find the entry in an array which is closest to time (preceding or following).
function closestEntry(array, time) {
  const index = mostRecentIndex(array, time);

  if (index === undefined) {
    return array.length ? array[0] : null;
  }

  if (index + 1 < array.length &&
      distance(time, array[index + 1].time) < distance(time, array[index].time)) {
    return array[index + 1];
  }
  return array[index];
}

//////////////////////////////
// Paint / Mouse Event Points
//////////////////////////////

// All paints that have occurred in the recording, in order. Include the
// beginning point of the recording as well, which is not painted and has
// a known point and time.
const gPaintPoints = [ { point: "0", time: 0 } ];

// All mouse events that have occurred in the recording, in order.
const gMouseEvents = [];

// All mouse click events that have occurred in the recording, in order.
const gMouseClickEvents = [];

function onPaints({ paints }) {
  paints.forEach(entry => insertEntrySorted(gPaintPoints, entry));
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
});

function closestPaintOrMouseEvent(time) {
  const paintEntry = closestEntry(gPaintPoints, time);
  const mouseEntry = closestEntry(gMouseEvents, time);

  if (!paintEntry) {
    return mouseEntry;
  }
  if (!mouseEntry) {
    return paintEntry;
  }
  if (distance(time, paintEntry.time) < distance(time, mouseEntry.time)) {
    return paintEntry;
  }
  return mouseEntry;
}

//////////////////////////////
// Paint Data Management
//////////////////////////////

// Map paint hashes to the associated screenshot.
const gScreenShots = new Map();

function addScreenShot(screenShot) {
  // We shouldn't ever see the same paint hash twice.
  if (!gScreenShots.has(screenShot.hash)) {
    gScreenShots.set(screenShot.hash, screenShot);
  }
}

// How recently a click must have occurred for it to be drawn.
const ClickThresholdMs = 200;

async function paintGraphicsAtTime(time) {
  const { point, paintHash } = mostRecentEntry(gPaintPoints, time);

  const existing = gScreenShots.get(paintHash);

  if (existing) {
    paintGraphics(existing);
    return;
  }

  const { screen } = await sendMessage(
    "Graphics.getPaintContents",
    { point, mimeType: "image/jpeg" },
    ThreadFront.sessionId
  );

  addScreenShot(screen);

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

  paintGraphics(screen, mouse);
}

//////////////////////////////
// Rendering State
//////////////////////////////

// Image to draw, if any.
let gDrawImage;

// Mouse information to draw.
let gDrawMouse;

// Text message to draw, if any.
let gDrawMessage;

function paintGraphics(screenShot, mouse) {
  addScreenShot(screenShot);
  gDrawImage = new Image();
  gDrawImage.onload = refreshGraphics;
  gDrawImage.src = `data:${screenShot.mimeType};base64,${screenShot.data}`;
  gDrawMouse = mouse;
  refreshGraphics();
}

function paintMessage(message) {
  gDrawImage = null;
  gDrawMouse = null;
  gDrawMessage = message;
  refreshGraphics();
}

function drawCursor(cx, x, y) {
  const scale = 3;
  const path = new Path2D(`
M ${x} ${y}
V ${y+10*scale}
L ${x+2*scale} ${y+8*scale}
L ${x+4*scale} ${y+13*scale}
L ${x+5.5*scale} ${y+12.6*scale}
L ${x+3.5*scale} ${y+7.6*scale}
L ${x+6.5*scale} ${y+7.8*scale}
Z
`);
  cx.fillStyle = "black";
  cx.fill(path);
  cx.strokeStyle = "white";
  cx.lineWidth = 1;
  cx.stroke(path);
}

function drawClick(cx, x, y) {
  cx.strokeStyle = "black";
  cx.lineWidth = 3;
  cx.beginPath();
  cx.arc(x, y, 50, 0, 2 * Math.PI);
  cx.stroke();
}

function refreshGraphics() {
  const canvas = document.getElementById("graphics");
  const cx = canvas.getContext("2d");

  const scale = window.devicePixelRatio;
  canvas.width = window.innerWidth * scale;
  canvas.height = window.innerHeight * scale;

  if (scale != 1) {
    canvas.style.transform = `
      scale(${1 / scale})
      translate(-${canvas.width / scale}px, -${canvas.height / scale}px)
    `;
  }

  if (gDrawImage) {
    cx.drawImage(gDrawImage, 0, 0);

    if (gDrawMouse) {
      const { x, y, clickX, clickY } = gDrawMouse;
      drawCursor(cx, x, y);
      if (clickX !== undefined) {
        drawClick(cx, x, y);
      }
    }
  } else if (gDrawMessage) {
    cx.font = `${25 * window.devicePixelRatio}px sans-serif`;
    const messageWidth = cx.measureText(gDrawMessage).width;
    cx.fillText(
      gDrawMessage,
      (canvas.width - messageWidth) / 2,
      canvas.height / 2
    );
  }
}

window.onresize = refreshGraphics;

module.exports = {
  closestPaintOrMouseEvent,
  paintGraphics,
  paintGraphicsAtTime,
  paintMessage,
};
