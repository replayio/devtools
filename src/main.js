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

const React = require("devtools/client/shared/vendor/react");
const ReactDOM = require("devtools/client/shared/vendor/react-dom");
const WebReplayPlayer = require("timeline/WebReplayPlayer");

const url = new URL(window.location.href);

const recordingId = url.searchParams.get("id");
const dispatch = url.searchParams.get("dispatch");

setTimeout(initialize, 0);

async function initialize() {
  if (!recordingId) {
    drawMessage("Recording ID not specified");
    return;
  }

  drawMessage("Loading…");
  const description = await sendMessage("Recording.getDescription", { recordingId });

  if (description.lastScreen) {
    drawGraphics(description.lastScreen);
  }

  const { sessionId } = await sendMessage("Recording.createSession", { recordingId });
}

const gToolbox = {};

const timeline = React.createElement(WebReplayPlayer, { toolbox: gToolbox });
ReactDOM.render(timeline, document.getElementById("toolbox-timeline"));

/////////////////////////
// Graphics
/////////////////////////

// Image to draw, if any.
let gDrawImage;

// Text message to draw, if any.
let gDrawMessage;

function drawGraphics({ mimeType, data }) {
  gDrawImage = new Image();
  gDrawImage.onload = refreshGraphics;
  gDrawImage.src = `data:${mimeType};base64,${data}`;
  refreshGraphics();
}

function drawMessage(message) {
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
    cx.fillText(gDrawMessage, (canvas.width - messageWidth) / 2, canvas.height / 2);
  }
}

window.onresize = refreshGraphics;

/////////////////////////
// Socket
/////////////////////////

const socket = new WebSocket(dispatch || "https://dispatch.webreplay.io");
let gSocketOpen = false;

socket.onopen = makeInfallible(onSocketOpen);
socket.onclose = makeInfallible(onSocketClose);
socket.onerror = makeInfallible(onSocketError);
socket.onmessage = makeInfallible(onSocketMessage);

let gPendingMessages = [];
let gNextMessageId = 1;

const gMessageWaiters = new Map();

function sendMessage(method, params) {
  const id = gNextMessageId++;
  const msg = { id, method, params };

  if (gSocketOpen) {
    doSend(msg);
  } else {
    gPendingMessages.push(msg);
  }

  const { promise, resolve, reject } = defer();
  gMessageWaiters.set(id, { resolve, reject });

  return promise;
}

const doSend = makeInfallible(msg => {
  console.log("SendMessage", msg);
  socket.send(JSON.stringify(msg));
});

function onSocketOpen() {
  console.log("Socket Open");
  gPendingMessages.forEach(msg => doSend(msg));
  gPendingMessages.length = 0;
  gSocketOpen = true;
}

function onSocketMessage(evt) {
  const msg = JSON.parse(evt.data);
  if (msg.id) {
    const { resolve, reject } = gMessageWaiters.get(msg.id);
    if (msg.error) {
      console.warn("Message failed", msg.error);
      reject(msg.error);
    } else {
      resolve(msg.result);
    }
  } else {
    console.error("Received message with no ID", msg);
  }
}

function onSocketClose() {
  console.log("Socket Closed");
}

function onSocketError() {
  console.log("Socket Error");
}

function makeInfallible(fn, thisv) {
  return (...args) => {
    try {
      fn.apply(thisv, args);
    } catch (e) {
      console.error(e);
    }
  };
}

function defer() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
