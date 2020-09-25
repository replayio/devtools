/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const { createElement, createFactory } = require("react");
const ReactDOM = require("react-dom");
const { Provider } = require("react-redux");
const { ThreadFront } = require("protocol/thread");
const { LogpointHandlers } = require("protocol/logpoint");

const actions = require("devtools/client/webconsole/actions/index");
const selectors = require("devtools/client/webconsole/selectors/index");
const { configureStore } = require("devtools/client/webconsole/store");
const { setupConsoleHelper } = require("ui/utils/bootstrap");

const Telemetry = require("devtools/client/shared/telemetry");

const EventEmitter = require("devtools/shared/event-emitter");
const App = createFactory(require("devtools/client/webconsole/components/App"));

const { setupServiceContainer } = require("devtools/client/webconsole/service-container");

const Constants = require("devtools/client/webconsole/constants");

function renderApp({ app, store, root }) {
  return ReactDOM.render(createElement(Provider, { store }, app), root);
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

let store = null;

class WebConsoleWrapper {
  /**
   *
   * @param {HTMLElement} parentNode
   * @param {WebConsoleUI} webConsoleUI
   * @param {Toolbox} toolbox
   * @param {Document} document
   */
  constructor(parentNode, webConsoleUI, toolbox, document) {
    EventEmitter.decorate(this);

    this.parentNode = parentNode;
    this.webConsoleUI = webConsoleUI;
    this.toolbox = toolbox;
    this.hud = this.webConsoleUI.hud;
    this.document = document;

    this.init = this.init.bind(this);
    this.dispatchPaused = this.dispatchPaused.bind(this);

    this.queuedMessageAdds = [];
    this.queuedMessageUpdates = [];
    this.queuedRequestUpdates = [];
    this.throttledDispatchPromise = null;
    this.telemetry = new Telemetry();

    ThreadFront.findConsoleMessages(this.onConsoleMessage);

    LogpointHandlers.onPointLoading = this.onLogpointLoading;
    LogpointHandlers.onResult = this.onLogpointResult;
    LogpointHandlers.clearLogpoint = this.clearLogpoint;
  }

  async init() {
    const { webConsoleUI } = this;

    return new Promise(resolve => {
      store = configureStore(this.webConsoleUI, {
        // We may not have access to the toolbox (e.g. in the browser console).
        telemetry: this.telemetry,
        thunkArgs: {
          webConsoleUI,
          hud: this.hud,
          toolbox: this.toolbox,
          client: this.webConsoleUI._commands,
        },
      });

      const serviceContainer = setupServiceContainer({
        webConsoleUI,
        toolbox: this.toolbox,
        hud: this.hud,
        webConsoleWrapper: this,
      });

      if (this.toolbox) {
        this.toolbox.threadFront.on("paused", this.dispatchPaused);
        this.toolbox.threadFront.on("instantWarp", this.dispatchPaused);
      }

      const app = App({
        serviceContainer,
        webConsoleUI,
        onFirstMeaningfulPaint: resolve,
        closeSplitConsole: this.closeSplitConsole,
      });

      // Render the root Application component.
      this.body = renderApp({
        app,
        store,
        root: this.parentNode,
      });

      setupConsoleHelper({ store, selectors, actions });
    });
  }

  onConsoleMessage = async (_, msg) => {
    const stacktrace = await convertStack(msg.stack, msg.data);
    const sourceId = stacktrace?.[0]?.sourceId;

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

    this.dispatchMessageAdd(packet);
  };

  onLogpointLoading = async (logGroupId, point, time, { scriptId, line, column }) => {
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

    this.dispatchMessageAdd(packet);
  };

  onLogpointResult = async (logGroupId, point, time, { scriptId, line, column }, pause, values) => {
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

    this.dispatchMessageAdd(packet);
  };

  clearLogpoint = logGroupId => {
    store.dispatch(actions.messagesClearLogpoint(logGroupId));
  };

  dispatchMessageAdd(packet) {
    this.batchedMessagesAdd([packet]);
  }

  dispatchMessagesAdd(messages) {
    this.batchedMessagesAdd(messages);
  }

  dispatchMessagesClear() {
    // We might still have pending message additions and updates when the clear action is
    // triggered, so we need to flush them to make sure we don't have unexpected behavior
    // in the ConsoleOutput.
    this.queuedMessageAdds = [];
    this.queuedMessageUpdates = [];
    this.queuedRequestUpdates = [];
    store.dispatch(actions.messagesClear());
    this.webConsoleUI.emitForTests("messages-cleared");
  }

  dispatchPaused({ point, time }) {
    store.dispatch(actions.setPauseExecutionPoint(point, time));
  }

  dispatchMessageUpdate(message, res) {
    // network-message-updated will emit when all the update message arrives.
    // Since we can't ensure the order of the network update, we check
    // that networkInfo.updates has all we need.
    // Note that 'requestPostData' is sent only for POST requests, so we need
    // to count with that.
    const NUMBER_OF_NETWORK_UPDATE = 8;

    let expectedLength = NUMBER_OF_NETWORK_UPDATE;
    if (res.networkInfo.updates.includes("responseCache")) {
      expectedLength++;
    }
    if (res.networkInfo.updates.includes("requestPostData")) {
      expectedLength++;
    }

    if (res.networkInfo.updates.length === expectedLength) {
      this.batchedMessageUpdates({ res, message });
    }
  }

  dispatchSidebarClose() {
    store.dispatch(actions.sidebarClose());
  }

  dispatchSplitConsoleCloseButtonToggle(selectedPanel) {
    if (!store) {
      return;
    }
    const shouldDisplayButton = this.toolbox && selectedPanel !== "console";
    store.dispatch(actions.splitConsoleCloseButtonToggle(shouldDisplayButton));
  }

  dispatchTabWillNavigate(packet) {
    const { ui } = store.getState();

    // For the browser console, we receive tab navigation
    // when the original top level window we attached to is closed,
    // but we don't want to reset console history and just switch to
    // the next available window.
    if (ui.persistLogs || this.webConsoleUI.isBrowserConsole) {
      // Add a type in order for this event packet to be identified by
      // utils/messages.js's `transformPacket`
      packet.type = "will-navigate";
      this.dispatchMessageAdd(packet);
    } else {
      this.webConsoleUI.clearNetworkRequests();
      this.dispatchMessagesClear();
      store.dispatch({
        type: Constants.WILL_NAVIGATE,
      });
    }
  }

  batchedMessageUpdates(info) {
    this.queuedMessageUpdates.push(info);
    this.setTimeoutIfNeeded();
  }

  batchedRequestUpdates(message) {
    this.queuedRequestUpdates.push(message);
    return this.setTimeoutIfNeeded();
  }

  batchedMessagesAdd(messages) {
    this.queuedMessageAdds = this.queuedMessageAdds.concat(messages);
    this.setTimeoutIfNeeded();
  }

  dispatchClearHistory() {
    store.dispatch(actions.clearHistory());
  }

  /**
   *
   * @param {String} expression: The expression to evaluate
   */
  dispatchEvaluateExpression(expression) {
    store.dispatch(actions.evaluateExpression(expression));
  }

  setZoomedRegion({ startTime, endTime, scale }) {
    store.dispatch(actions.setZoomedRegion(startTime, endTime, scale));
  }

  /**
   * Returns a Promise that resolves once any async dispatch is finally dispatched.
   */
  waitAsyncDispatches() {
    if (!this.throttledDispatchPromise) {
      return Promise.resolve();
    }
    return this.throttledDispatchPromise;
  }

  setTimeoutIfNeeded() {
    if (this.throttledDispatchPromise) {
      return this.throttledDispatchPromise;
    }
    this.throttledDispatchPromise = new Promise(done => {
      setTimeout(async () => {
        this.throttledDispatchPromise = null;

        if (!store) {
          // The store is not initialized yet, we can call setTimeoutIfNeeded so the
          // messages will be handled in the next timeout when the store is ready.
          this.setTimeoutIfNeeded();
          return;
        }

        store.dispatch(actions.messagesAdd(this.queuedMessageAdds));

        const length = this.queuedMessageAdds.length;

        // This telemetry event is only useful when we have a toolbox so only
        // send it when we have one.
        if (this.toolbox) {
          this.telemetry.addEventProperty(
            this.toolbox,
            "enter",
            "webconsole",
            null,
            "message_count",
            length
          );
        }

        this.queuedMessageAdds = [];

        if (this.queuedMessageUpdates.length > 0) {
          for (const { message, res } of this.queuedMessageUpdates) {
            await store.dispatch(actions.networkMessageUpdate(message, null, res));
            this.webConsoleUI.emitForTests("network-message-updated", res);
          }
          this.queuedMessageUpdates = [];
        }
        if (this.queuedRequestUpdates.length > 0) {
          for (const { id, data } of this.queuedRequestUpdates) {
            await store.dispatch(actions.networkUpdateRequest(id, data));
          }
          this.queuedRequestUpdates = [];

          // Fire an event indicating that all data fetched from
          // the backend has been received. This is based on
          // 'FirefoxDataProvider.isQueuePayloadReady', see more
          // comments in that method.
          // (netmonitor/src/connector/firefox-data-provider).
          // This event might be utilized in tests to find the right
          // time when to finish.
          this.webConsoleUI.emitForTests("network-request-payload-ready");
        }
        done();
      }, 50);
    });
    return this.throttledDispatchPromise;
  }

  getStore() {
    return store;
  }

  subscribeToStore(callback) {
    store.subscribe(() => callback(store.getState()));
  }

  createElement(nodename) {
    return this.document.createElement(nodename);
  }

  // Called by pushing close button.
  closeSplitConsole = () => {
    this.toolbox.toggleSplitConsole(false);
  };
}

// Exports from this module
module.exports = WebConsoleWrapper;
