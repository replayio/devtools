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

//////////////////////////////
// Paint / Mouse Event Points
//////////////////////////////

// All paints that have occurred in the recording, in order. Include the
// beginning point of the recording as well, which is not painted and has
// a known point and time.
const gPaintPoints = [ new PaintPoint("0", 0) ];

// Information about a point where a paint occurred.
function PaintPoint(point, time) {
  // Associated execution point and time for this paint.
  this.point = point;
  this.time = time;

  // Any mouse events that occurred between this paint and the following one.
  this.mouseEvents = [];

  // If the paint data at this point has been fetched, the associated hash.
  this.paintHash = null;
}

function mostRecentPaintPointIndex(time) {
  const index = binarySearch(0, gPaintPoints.length, index => {
    return time - gPaintPoints[index].time;
  });
  assert(gPaintPoints[index].time <= time);
  if (index + 1 < gPaintPoints.length) {
    assert(gPaintPoints[index + 1].time >= time);
  }
  return index;
}

function addPaintPoint({ point, time }) {
  const entry = new PaintPoint(point, time);

  if (gPaintPoints[gPaintPoints.length - 1].time <= time) {
    gPaintPoints.push(entry);
    return;
  }

  const index = mostRecentPaintPointIndex(time);
  gPaintPoints.splice(index, 0, entry);
}

function closestPaintOrMouseEvent(time) {
  const index = mostRecentPaintPointIndex(time);

  let closestPoint = gPaintPoints[index].point;
  let closestTime = gPaintPoints[index].time;

  function newPoint(info) {
    if (Math.abs(time - info.time) < Math.abs(time - closestTime)) {
      closestPoint = info.point;
      closestTime = info.time;
    }
  }

  gPaintPoints[index].mouseEvents.forEach(newPoint);
  if (index + 1 < gPaintPoints.length) {
    newPoint(gPaintPoints[index + 1]);
  }

  return { point: closestPoint, time: closestTime };
}

function onPaints({ paints }) {
  log(`PlayerPaints ${JSON.stringify(paints)}`);
  paints.forEach(addPaintPoint);
}

function onMouseEvents(events) {
  log(`OnMouseEvents ${JSON.stringify(events)}`);
}

ThreadFront.sessionWaiter.promise.then(sessionId => {
  sendMessage("Graphics.findPaints", {}, sessionId);
  addEventListener("Graphics.paintPoints", onPaints);

  sendMessage("Session.findMouseEvents", {}, sessionId);
  addEventListener("Session.onMouseEvents", onMouseEvents);
});

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

async function paintGraphicsAtTime(time) {
  const index = mostRecentPaintPointIndex(time);
  const { point, paintHash } = gPaintPoints[index];

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
  paintGraphics(screen);
}

//////////////////////////////
// Rendering State
//////////////////////////////

// Image to draw, if any.
let gDrawImage;

// Text message to draw, if any.
let gDrawMessage;

function paintGraphics(screenShot) {
  addScreenShot(screenShot);
  gDrawImage = new Image();
  gDrawImage.onload = refreshGraphics;
  gDrawImage.src = `data:${screenShot.mimeType};base64,${screenShot.data}`;
  refreshGraphics();
}

function paintMessage(message) {
  gDrawImage = null;
  gDrawMessage = message;
  refreshGraphics();
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
