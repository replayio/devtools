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

// Logpoints are used to perform evaluations at sets of execution points in the
// recording being debugged. They are implemented using the WRP Analysis domain.
// This file manages logpoint state, for setting/removing logpoints and emitting
// events which the webconsole listens to.
//
// Each logpoint has an associated log group ID, used to manipulate all the
// messages associated with the logpoint atomically.

const { addEventListener, sendMessage } = require("./socket");
const { assert } = require("./utils");
const { ThreadFront } = require("./thread");

// Map log group ID to information about the logpoint.
const gLogpoints = new Map();

addEventListener("Analysis.analysisResult", ({ analysisId, results }) => {
  console.log("AnalysisResult", analysisId, results);
});

addEventListener("Analysis.analysisPoints", ({ analysisId, points }) => {
  console.log("AnalysisPoints", analysisId, points);
});

async function setLogpoint(logGroupId, scriptId, line, column, text) {
  const mapper = `
    const { point, time, pauseId } = input;
    const { frameId } = sendCommand("Pause.getTopFrame");
    const rv = sendCommand("Pause.evaluateInFrame", { frameId, expression: ${text} });
    return [{ key: point, value: { time, pauseId, ...rv } }];
  `;

  const waiter = sendMessage("Analysis.createAnalysis", { mapper, effectful: true });
  if (gLogpoints.has(logGroupId)) {
    gLogpoints.get(logGroupId).push(waiter);
  } else {
    gLogpoints.set(logGroupId, [waiter]);
  }

  const { analysisId } = await waiter;

  sendMessage("Analysis.addLocation", {
    analysisId,
    sessionId: ThreadFront.sessionId,
    location: { scriptId, line, column },
  });
  sendMessage("Analysis.findAnalysisPoints", { analysisId });
  sendMessage("Analysis.runAnalysis", { analysisId });
}

function setLogpointByURL(logGroupId, scriptUrl, line, column, text) {
  const scriptIds = ThreadFront.urlScripts.get(scriptUrl);
  (scriptIds || []).forEach(scriptId => {
    setLogpoint(logGroupId, scriptId, line, column, text);
  });
}

function removeLogpoint(logGroupId) {
  const waiters = gLogpoints.get(logGroupId);
  waiters.forEach(async waiter => {
    const { analysisId } = await waiter;
    sendMessage("Analysis.cancelAnalysis", { analysisId });
  });
}

module.exports = {
  setLogpoint,
  setLogpointByURL,
  removeLogpoint,
};
