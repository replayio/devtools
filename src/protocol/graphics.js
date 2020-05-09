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

// All paints that have occurred in the recording, in order. Include the
// beginning point of the recording as well, which is not painted and has
// a known point and time.
const gPaintPoints = [
  { point: "0", time: 0, mouseEvents: [] },
];

function mostRecentPaintPointIndex(time) {
  const index = binarySearch(0, gPaintPoints.length, index => {
    return time - gPaintPoints[index].time;
  });
  if (gPaintPoints[index].time > time ||
      (index + 1 < gPaintPoints.length && gPaintPoints[index + 1].time > time)) {
    throw new Error("Binary search failed");
  }
  return index;
}

function addPaintPoint({ point, time }) {
  const entry = { point, time, mouseEvents: [] };

  if (gPaintPoints[gPaintPoints.length - 1].time <= time) {
    gPaintPoints.push(entry);
    return;
  }

  const index = mostRecentPaintPointIndex(time);
  gPaintPoints.splice(index, 0, entry);
}

function closestPaintOrMouseEvent(time) {
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

module.exports = {
  closestPaintOrMouseEvent,
};
