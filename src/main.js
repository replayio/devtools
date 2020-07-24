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

const url = new URL(window.location.href);

const recordingId = url.searchParams.get("id");
const dispatch = url.searchParams.get("dispatch");
const test = url.searchParams.get("test");

// During testing, make sure we clear local storage before importing
// any code that might instantiate preferences from local storage.
if (test) {
  localStorage.clear();
  require("devtools-modules").asyncStorage.clear();
}

// *** WARNING ***
//
// Do not use "import" in this file. The import will run before we clear
// the local storage above, and existing local storage contents may be used
// when running automated tests, which we don't want to happen. It would
// be good if this was less fragile...
//

const { initSocket, sendMessage, log, setStatus, addEventListener } = require("protocol/socket");
const { ThreadFront } = require("protocol/thread");
const { throttle, clamp, EventEmitter } = require("protocol/utils");
const loadImages = require("image/image");
const { bootstrapApp } = require("ui/utils/bootstrap");
const FullStory = require("@fullstory/browser");

// Create a session to use while debugging.
async function createSession() {
  addEventListener("Recording.uploadedData", onUploadedData);
  addEventListener("Recording.sessionError", onSessionError);

  try {
    const { sessionId } = await sendMessage("Recording.createSession", {
      recordingId,
    });
    setStatus("");
    window.sessionId = sessionId;
    ThreadFront.setSessionId(sessionId);
    ThreadFront.setTest(test);
  } catch (e) {
    if (e.code == 9) {
      // Invalid recording ID.
      setStatus("Error: Invalid recording ID");
    } else {
      throw e;
    }
  }
}

function onUploadedData({ uploaded, length }) {
  const uploadedMB = (uploaded / (1024 * 1024)).toFixed(2);
  const lengthMB = length ? (length / (1024 * 1024)).toFixed(2) : undefined;
  if (lengthMB) {
    setStatus(`Waiting for upload… ${uploadedMB} / ${lengthMB} MB`);
  } else {
    setStatus(`Waiting for upload… ${uploadedMB} MB`);
  }
}

function onSessionError({ message }) {
  setStatus(`Error: ${message}`);
}

async function initialize() {
  loadImages();

  if (!recordingId) {
    setStatus("Recording ID not specified");
    return;
  }

  initSocket(dispatch);

  createSession();

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
      left <= mouseClientX && mouseClientX <= right && top <= mouseClientY && mouseClientY <= bottom
    );
  };
}

if (!test) {
  FullStory.init({ orgId: "VXD33", devMode: test });
}

setTimeout(async () => {
  // Wait for CodeMirror to load asynchronously.
  while (!window.CodeMirror) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (!test) {
    FullStory.event("Start", {
      recordingId,
    });
  }

  bootstrapApp({ initialize });
}, 0);
