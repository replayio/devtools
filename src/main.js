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

const React = require("devtools/client/shared/vendor/react");
const ReactDOM = require("devtools/client/shared/vendor/react-dom");
const WebReplayPlayer = require("timeline/WebReplayPlayer");
const { initSocket, sendMessage } = require("protocol/socket");
const { ThreadFront } = require("protocol/thread");
const { paintMessage } = require("protocol/graphics");
const { DebuggerPanel } = require("devtools/client/debugger/panel");
const { WebConsolePanel } = require("devtools/client/webconsole/panel");

const { LocalizationHelper } = require("shims/l10n");

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

setTimeout(initialize, 0);

async function initialize() {
  if (!recordingId) {
    paintMessage("Recording ID not specified");
    return;
  }

  initSocket(dispatch);

  paintMessage("Loading…");

  sendMessage("Recording.getDescription", { recordingId }).then(
    (description) => {
      gToolbox.webReplayPlayer.setRecordingDescription(description);
    }
  );

  sendMessage("Recording.createSession", { recordingId }).then(
    ({ sessionId }) => {
      ThreadFront.setSessionId(sessionId);
      if (test) {
        window.Test = require("./test/harness");
        ThreadFront.setTest(test);
      }
    }
  );
}

const gToolbox = {
  currentTool: null,

  _panels: {},

  getPanelWhenReady(id) {
    return new Promise((resolve) => {});
  },

  threadFront: ThreadFront,

  on() {},

  getHighlighter() {
    return {};
  },

  addTool(name, panel) {
    this._panels[name] = panel;
    const button = document.getElementById(`toolbox-toolbar-${name}`);
    button.addEventListener("click", () => this.selectTool(name));
  },

  loadTool(name) {
    return new Promise((resolve) => {});
  },

  selectTool(name) {
    if (name == this.currentTool) {
      return;
    }
    this.currentTool = name;
    const toolbox = document.getElementById(`toolbox`);
    toolbox.classList = name;
  },

  sourceMapService: {
    getOriginalLocations: (locations) => locations,
    getOriginalLocation: (location) => location,
  },
  parserService: {
    hasSyntaxError: (text) => false,
  },

  // Helpers for debugging.
  webconsoleState() {
    gToolbox.webconsoleHud.ui.wrapper.getStore().getState();
  },
};

window.gToolbox = gToolbox;

const timeline = React.createElement(WebReplayPlayer, { toolbox: gToolbox });
ReactDOM.render(timeline, document.getElementById("toolbox-timeline"));

setTimeout(() => {
  const debuggerPanel = new DebuggerPanel(gToolbox);
  gToolbox.addTool("jsdebugger", debuggerPanel);
  debuggerPanel.open();

  const consolePanel = new WebConsolePanel(gToolbox);
  gToolbox.addTool("webconsole", consolePanel);
  consolePanel.open();

  gToolbox.selectTool("jsdebugger");
}, 0);
