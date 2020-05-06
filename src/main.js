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
const { initSocket, sendMessage } = require("protocol/socket");
const { ThreadFront } = require("protocol/thread");

const url = new URL(window.location.href);

const recordingId = url.searchParams.get("id");
const dispatch = url.searchParams.get("dispatch");

initSocket(dispatch);
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
  ThreadFront.setSessionId(sessionId);
}

const gToolbox = {
  getPanelWhenReady(panel) {
    return new Promise(resolve => {});
  },

  threadFront: ThreadFront,
};

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
