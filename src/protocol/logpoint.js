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
const { ThreadFront, ValueFront, Pause } = require("./thread");

// Map log group ID to information about the logpoint.
const gLogpoints = new Map();

// Map analysis ID to log group ID.
const gAnalysisLogGroupIDs = new Map();

// Hooks for adding messages to the console.
const LogpointHandlers = {};

addEventListener("Analysis.analysisResult", ({ analysisId, results }) => {
  console.log("AnalysisResults", results);

  const logGroupId = gAnalysisLogGroupIDs.get(analysisId);
  if (!gLogpoints.has(logGroupId)) {
    return;
  }

  if (LogpointHandlers.onResult) {
    results.forEach(({ key, value: { time, pauseId, location, values, datas } }) => {
      const pause = new Pause(ThreadFront.sessionId);
      pause.instantiate(pauseId);
      datas.forEach(d => pause.addData(d));
      const valueFronts = values.map(v => new ValueFront(pause, v));
      LogpointHandlers.onResult(logGroupId, key, time, location, pause, valueFronts);
    });
  }
});

addEventListener("Analysis.analysisPoints", ({ analysisId, points }) => {
  console.log("AnalysisPoints", points);

  const logGroupId = gAnalysisLogGroupIDs.get(analysisId);
  if (!gLogpoints.has(logGroupId)) {
    return;
  }

  if (LogpointHandlers.onPointLoading) {
    points.forEach(({ point, time, frame }) => {
      LogpointHandlers.onPointLoading(logGroupId, point, time, frame);
    });
  }
});

async function createLogpointAnalysis(logGroupId, mapper) {
  const waiter = sendMessage("Analysis.createAnalysis", { mapper, effectful: true });
  if (gLogpoints.has(logGroupId)) {
    gLogpoints.get(logGroupId).push(waiter);
  } else {
    gLogpoints.set(logGroupId, [waiter]);
  }

  const { analysisId } = await waiter;
  gAnalysisLogGroupIDs.set(analysisId, logGroupId);
  return analysisId;
}

async function setLogpoint(logGroupId, scriptId, line, column, text, condition) {
  let conditionSection = "";
  if (condition) {
    // When there is a condition, don't add a message if it returns undefined
    // or a falsy primitive.
    conditionSection = `
      const { result: conditionResult } = sendCommand(
        "Pause.evaluateInFrame",
        { frameId, expression: ${JSON.stringify(condition)} }
      );
      if (conditionResult.returned) {
        const { returned } = conditionResult;
        if ("value" in returned && !returned.value) {
          return [];
        }
        if (!Object.keys(returned).length) {
          // Undefined.
          return [];
        }
      }
    `;
  }

  const mapper = `
    const { point, time, pauseId } = input;
    const { frame } = sendCommand("Pause.getTopFrame");
    const { frameId, functionName, location } = frame;
    ${conditionSection}
    const bindings = [
      { name: "displayName", value: functionName || "" }
    ];
    const { result } = sendCommand(
      "Pause.evaluateInFrame",
      { frameId, bindings, expression: "[" + ${JSON.stringify(text)} + "]" }
    );
    const values = [];
    const datas = [result.data];
    if (result.exception) {
      values.push(result.exception);
    } else {
      const { object } = result.returned;
      const { result: lengthResult } = sendCommand(
        "Pause.getObjectProperty",
        { object, name: "length" }
      );
      datas.push(lengthResult.data);
      const length = lengthResult.returned.value;
      for (let i = 0; i < length; i++) {
        const { result: elementResult } = sendCommand(
          "Pause.getObjectProperty",
          { object, name: i.toString() }
        );
        values.push(elementResult.returned);
        datas.push(elementResult.data);
      }
    }
    return [{ key: point, value: { time, pauseId, location, values, datas } }];
  `;

  const analysisId = await createLogpointAnalysis(logGroupId, mapper);

  sendMessage("Analysis.addLocation", {
    analysisId,
    sessionId: ThreadFront.sessionId,
    location: { scriptId, line, column },
  });
  sendMessage("Analysis.runAnalysis", { analysisId });

  // Don't add loading messages for conditional logpoints, as we don't know if
  // analysis points will actually generate a message.
  if (!condition) {
    sendMessage("Analysis.findAnalysisPoints", { analysisId });
  }
}

function setLogpointByURL(logGroupId, scriptUrl, line, column, text, condition) {
  const scriptIds = ThreadFront.urlScripts.get(scriptUrl);
  (scriptIds || []).forEach(scriptId => {
    setLogpoint(logGroupId, scriptId, line, column, text, condition);
  });
}

async function setEventLogpoint(logGroupId, eventTypes) {
  const mapper = `
    const { point, time, pauseId } = input;
    const { frame } = sendCommand("Pause.getTopFrame");
    const { frameId, location } = frame;
    const { result } = sendCommand(
      "Pause.evaluateInFrame",
      { frameId, expression: "arguments[0]" }
    );
    const values = [];
    const datas = [result.data];
    if (result.exception) {
      values.push(result.exception);
    } else {
      values.push(result.returned);
    }
    return [{ key: point, value: { time, pauseId, location, values, datas } }];
  `;

  const analysisId = await createLogpointAnalysis(logGroupId, mapper);

  for (const eventType of eventTypes) {
    sendMessage("Analysis.addEventHandlerEntryPoints", {
      analysisId,
      sessionId: ThreadFront.sessionId,
      eventType,
    });
  }

  sendMessage("Analysis.runAnalysis", { analysisId });
  sendMessage("Analysis.findAnalysisPoints", { analysisId });
}

async function setExceptionLogpoint(logGroupId) {
  const mapper = `
    const { point, time, pauseId } = input;
    const { frame } = sendCommand("Pause.getTopFrame");
    const { location } = frame;
    const { exception, data } = sendCommand("Pause.getExceptionValue");
    const values = [{ value: "Exception" }, exception];
    const datas = [data];
    return [{ key: point, value: { time, pauseId, location, values, datas } }];
  `;

  const analysisId = await createLogpointAnalysis(logGroupId, mapper);

  sendMessage("Analysis.addExceptionPoints", {
    analysisId,
    sessionId: ThreadFront.sessionId,
  });

  sendMessage("Analysis.runAnalysis", { analysisId });
  sendMessage("Analysis.findAnalysisPoints", { analysisId });
}

function removeLogpoint(logGroupId) {
  const waiters = gLogpoints.get(logGroupId);
  if (!waiters) {
    return;
  }
  if (LogpointHandlers.clearLogpoint) {
    LogpointHandlers.clearLogpoint(logGroupId);
  }
  gLogpoints.delete(logGroupId);
  waiters.forEach(async waiter => {
    const { analysisId } = await waiter;
    sendMessage("Analysis.releaseAnalysis", { analysisId });
  });
}

module.exports = {
  setLogpoint,
  setLogpointByURL,
  setEventLogpoint,
  setExceptionLogpoint,
  removeLogpoint,
  LogpointHandlers,
};
