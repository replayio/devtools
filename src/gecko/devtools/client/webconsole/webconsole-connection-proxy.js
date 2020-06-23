/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { ThreadFront } = require("protocol/thread");
const { LogpointHandlers } = require("protocol/logpoint");

function WebConsoleConnectionProxy(ui) {
  this.ui = ui;

  ThreadFront.findConsoleMessages(this.onConsoleMessage.bind(this));

  LogpointHandlers.onPointLoading = this.onLogpointLoading.bind(this);
  LogpointHandlers.onResult = this.onLogpointResult.bind(this);
  LogpointHandlers.clearLogpoint = this.clearLogpoint.bind(this);
}

function convertStack(stack, { frames }) {
  if (!stack) {
    return null;
  }
  return Promise.all(
    stack.map(async frameId => {
      const frame = frames.find(f => f.frameId == frameId);
      const location = await ThreadFront.getPreferredLocation(frame.location);
      return {
        filename: await ThreadFront.getScriptURL(location.scriptId),
        sourceId: location.scriptId,
        lineNumber: location.line,
        columnNumber: location.column,
        functionName: frame.functionName,
      };
    })
  );
}

WebConsoleConnectionProxy.prototype = {
  async onConsoleMessage(pause, msg) {
    //console.log("ConsoleMessage", msg);

    const stacktrace = await convertStack(msg.stack, msg.data);
    const sourceId = stacktrace ? stacktrace[0].sourceId : undefined;

    let { url, scriptId, line, column } = msg;

    if (msg.point.frame) {
      // If the execution point has a location, use any mappings in that location.
      // The message properties do not reflect any source mapping.
      const location = await ThreadFront.getPreferredLocation(msg.point.frame);
      url = await ThreadFront.getScriptURL(location.scriptId);
      line = location.line;
      column = location.column;
    } else {
      if (!scriptId) {
        const ids = ThreadFront.getScriptIdsForURL(url);
        if (ids.length == 1) {
          scriptId = ids[0];
        }
      }
      if (scriptId) {
        // Ask the ThreadFront to map the location we got manually.
        const location = await ThreadFront.getPreferredMappedLocation({
          scriptId,
          line,
          column,
        });
        url = await ThreadFront.getScriptURL(location.scriptId);
        line = location.line;
        column = location.column;
      }
    }

    const packet = {
      errorMessage: msg.text,
      errorMessageName: "ErrorMessageName",
      sourceName: url,
      sourceId,
      lineNumber: line,
      columnNumber: column,
      category: msg.source,
      warning: msg.level == "warning",
      error: msg.level == "error",
      info: msg.level == "info",
      trace: msg.level == "trace",
      assert: msg.level == "assert",
      stacktrace,
      argumentValues: msg.argumentValues,
      executionPoint: msg.point.point,
      executionPointTime: msg.point.time,
      executionPointHasFrames: !!stacktrace,
    };

    this.ui.wrapper.dispatchMessageAdd(packet);
  },

  async onLogpointLoading(logGroupId, point, time, { scriptId, line, column }) {
    const packet = {
      errorMessage: "Loading...",
      sourceName: await ThreadFront.getScriptURL(scriptId),
      sourceId: scriptId,
      lineNumber: line,
      columnNumber: column,
      category: "ConsoleAPI",
      info: true,
      executionPoint: point,
      executionPointTime: time,
      executionPointHasFrames: true,
      logpointId: logGroupId,
    };

    this.ui.wrapper.dispatchMessageAdd(packet);
  },

  async onLogpointResult(logGroupId, point, time, { scriptId, line, column }, pause, values) {
    const packet = {
      errorMessage: "",
      sourceName: await ThreadFront.getScriptURL(scriptId),
      sourceId: scriptId,
      lineNumber: line,
      columnNumber: column,
      category: "ConsoleAPI",
      info: true,
      argumentValues: values,
      executionPoint: point,
      executionPointTime: time,
      executionPointHasFrames: true,
      logpointId: logGroupId,
    };

    this.ui.wrapper.dispatchMessageAdd(packet);
  },

  clearLogpoint(logGroupId) {
    this.ui.wrapper.dispatchClearLogpointMessages(logGroupId);
  },
};

exports.WebConsoleConnectionProxy = WebConsoleConnectionProxy;
