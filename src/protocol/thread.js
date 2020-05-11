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

// ThreadFront is the main interface used to interact with the singleton
// WRP session. This interface is based on the one normally used when the
// devtools interact with a thread: at any time the thread is either paused
// at a particular point, or resuming on its way to pause at another point.
//
// This model is different from the one used in the WRP, where queries are
// performed on the state at different points in the recording. This layer
// helps with adapting the devtools to the WRP.

const {
  sendMessage,
  addEventListener,
} = require("./socket");
const { defer, assert } = require("./utils");

const ThreadFront = {
  // When replaying there is only a single thread currently. Use this thread ID
  // everywhere needed throughout the devtools client.
  id: "MainThreadId",

  sessionId: null,
  sessionWaiter: defer(),

  // Map scriptId to URL.
  scriptURLs: new Map(),

  // Map URL to scriptId[].
  urlScripts: new Map(),

  skipPausing: false,

  // Map breakpointId to information about the breakpoint, for all installed breakpoints.
  breakpoints: new Map(),

  setSessionId(sessionId) {
    this.sessionId = sessionId;
    this.sessionWaiter.resolve(sessionId);
  },

  async ensureProcessed(onMissingRegions, onUnprocessedRegions) {
    const sessionId = await this.sessionWaiter.promise;

    sendMessage("Session.ensureProcessed", {}, sessionId);
    addEventListener("Session.missingRegions", onMissingRegions);
    addEventListener("Session.unprocessedRegions", onUnprocessedRegions);
  },

  timeWarp(point) {},

  async findScripts(onScript) {
    const sessionId = await this.sessionWaiter.promise;

    sendMessage("Debugger.findScripts", {}, sessionId);
    addEventListener("Debugger.scriptParsed", script => {
      const { scriptId, url } = script;
      if (url) {
        this.scriptURLs.set(scriptId, url);
        if (this.urlScripts.has(url)) {
          this.urlScripts.get(url).push(scriptId);
        } else {
          this.urlScripts.set(url, [scriptId]);
        }
      }
      onScript(script);
    });
  },

  async getScriptSource(scriptId) {
    const { scriptSource, contentType } = await sendMessage(
      "Debugger.getScriptSource",
      { scriptId },
      this.sessionId
    );
    return { scriptSource, contentType };
  },

  async getBreakpointPositionsCompressed(scriptId, range) {
    const begin = range ? range.start : undefined;
    const end = range ? range.end : undefined;
    const { lineLocations } = await sendMessage(
      "Debugger.getPossibleBreakpoints",
      { scriptId, begin, end },
      this.sessionId
    );
    return lineLocations;
  },

  setSkipPausing(skip) {
    this.skipPausing = skip;
  },

  async setBreakpoint(scriptId, line, column, condition) {
    const location = { scriptId, line, column };
    try {
      const { breakpointId } = await sendMessage(
        "Debugger.setBreakpoint",
        { location, condition },
        this.sessionId
      );
      if (breakpointId) {
        this.breakpoints.set(breakpointId, { location });
      }
    } catch (e) {
      // An error will be generated if the breakpoint location is not valid for
      // this script. We don't keep precise track of which locations are valid
      // for which inline scripts in an HTML file (which share the same URL),
      // so ignore these errors.
    }
  },

  setBreakpointByURL(url, line, column, condition) {
    return Promise.all(this.urlScripts.get(url).map(scriptId => {
      return this.setBreakpoint(scriptId, line, column, condition);
    }));
  },

  async removeBreakpoint(scriptId, line, column) {
    for (const [breakpointId, { location }] of this.breakpoints.entries()) {
      if (location.scriptId == scriptId && location.line == line && location.column == column) {
        this.breakpoints.delete(breakpointId);
        await sendMessage("Debugger.removeBreakpoint", { breakpointId }, this.sessionId);
      }
    }
  },

  removeBreakpointByURL(url, line, column) {
    return Promise.all(this.urlScripts.get(url).map(scriptId => {
      return this.removeBreakpoint(scriptId, line, column);
    }));
  },
};

module.exports = { ThreadFront };
