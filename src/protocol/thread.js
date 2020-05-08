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
// WRP session. This name is used to match up with the corresponding object
// the Firefox devtools use to connect to debuggee tabs.

const {
  sendMessage,
  addEventListener,
  removeEventListener,
} = require("./socket");
const { defer, assert } = require("./utils");

const ThreadFront = {
  sessionId: null,
  sessionWaiter: defer(),

  setSessionId(sessionId) {
    this.sessionId = sessionId;
    this.sessionWaiter.resolve();
  },

  async ensureProcessed(onMissingRegions, onUnprocessedRegions) {
    await this.sessionWaiter.promise;

    assert(!this.hasEnsureProcessed);
    this.hasEnsureProcessed = true;

    sendMessage("Session.ensureProcessed", {}, this.sessionId);
    addEventListener("Session.missingRegions", onMissingRegions);
    addEventListener("Session.unprocessedRegions", onUnprocessedRegions);
  },

  async findPaints(onPaints) {
    await this.sessionWaiter.promise;

    assert(!this.hasFindPaints);
    this.hasFindPaints = true;

    sendMessage("Graphics.findPaints", {}, this.sessionId);
    addEventListener("Graphics.paintPoints", onPaints);
  },

  async findMouseEvents(onMouseEvents) {
    await this.sessionWaiter.promise;

    assert(!this.hasFindMouseEvents);
    this.hasFindMouseEvents = true;

    sendMessage("Session.findMouseEvents", {}, this.sessionId);
    addEventListener("Session.onMouseEvents", onMouseEvents);
  },
};

module.exports = { ThreadFront };
