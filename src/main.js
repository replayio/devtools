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

require("./styles.css");

const React = require("react");
const ReactDOM = require("react-dom");
import App from "ui/components/App";

const { initSocket, sendMessage, log } = require("protocol/socket");
const { ThreadFront } = require("protocol/thread");
const { paintMessage } = require("protocol/graphics");
const { throttle, clamp, EventEmitter } = require("protocol/utils");
const loadImages = require("image/image");

const { LocalizationHelper } = require("shims/l10n");

// Instantiate preferences early on from this rather obscure file...
require("devtools/client/debugger/src/utils/prefs");

window.l10n = new LocalizationHelper(
  "devtools/client/locales/debugger.properties"
);

window.PrefObserver = function () {};
window.PrefObserver.prototype = {
  on: () => {},
  off: () => {},
};

const url = new URL(window.location.href);

const recordingId = url.searchParams.get("id");
const dispatch = url.searchParams.get("dispatch");
const test = url.searchParams.get("test");

if (test) {
  localStorage.clear();
  require("devtools-modules").asyncStorage.clear();
}

// Create a session to use while debugging.
async function createSession() {
  const { sessionId } = await sendMessage("Recording.createSession", {
    recordingId,
  });
  window.sessionId = sessionId;
  ThreadFront.setSessionId(sessionId);
  if (test) {
    await gToolbox.selectTool("debugger");
    window.Test = require("./test/harness");
    ThreadFront.setTest(test);
  }
}

async function initialize() {
  if (!recordingId) {
    paintMessage("Recording ID not specified");
    return;
  }

  initSocket(dispatch);

  paintMessage("");

  createSession();

  loadImages();

  document.body.addEventListener("contextmenu", e => e.preventDefault());

  // Set the current mouse position on the window. This is used in places where
  // testing element.matches(":hover") does not work right for some reason.
  document.body.addEventListener("mousemove", e => {
    window.mouseClientX = e.clientX;
    window.mouseClientY = e.clientY;
  });
  window.elementIsHovered = elem => {
    const { left, top, right, bottom } = elem.getBoundingClientRect();
    const { mouseClientX, mouseClientY } = window;
    return (
      left <= mouseClientX &&
      mouseClientX <= right &&
      top <= mouseClientY &&
      mouseClientY <= bottom
    );
  };
}

setTimeout(async () => {
  // Wait for CodeMirror to load asynchronously.
  while (!window.CodeMirror) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  ReactDOM.render(
    React.createElement(App, { initialize }),
    document.querySelector("#viewer")
  );
}, 0);
