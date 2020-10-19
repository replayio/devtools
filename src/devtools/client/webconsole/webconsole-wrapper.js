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
const { setupConsoleHelper } = require("ui/utils/bootstrap/helpers");

const Telemetry = require("devtools/client/shared/telemetry");

const EventEmitter = require("devtools/shared/event-emitter");
const App = createFactory(require("devtools/client/webconsole/components/App"));

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

function setupServiceContainer({ webConsoleUI, hud, toolbox, webConsoleWrapper }) {
  const { highlight, unhighlight } = toolbox.getHighlighter();

  return {
    // NOTE these methods are proxied currently because the
    // service container is passed down the tree. These methods should eventually
    // be moved to redux actions.
    openLink: (url, e) => hud.openLink(url, e),
    openNodeInInspector: grip => hud.openNodeInInspector(grip),
    getInputSelection: () => hud.getInputSelection(),
    focusInput: () => hud.focusInput(),
    setInputValue: value => hud.setInputValue(value),
    onMessageHover: (type, message) => webConsoleUI.onMessageHover(type, message),
    getJsTermTooltipAnchor: () => webConsoleUI.getJsTermTooltipAnchor(),
    attachRefToWebConsoleUI: (id, node) => webConsoleUI.attachRef(id, node),
    requestData: (id, type) => webConsoleWrapper.requestData(id, type),
    createElement: nodename => webConsoleWrapper.createElement(nodename),
    highlightDomElement: highlight,
    unHighlightDomElement: unhighlight,
    jumpToExecutionPoint: (point, time, hasFrames) =>
      toolbox.threadFront.timeWarp(point, time, hasFrames),
    onViewSourceInDebugger: frame => hud.onViewSourceInDebugger(frame),
  };
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
        telemetry: this.telemetry,
        thunkArgs: {
          webConsoleUI,
          hud: this.hud,
          toolbox: this.toolbox,
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
    store.dispatch(actions.messagesClear());
  }

  dispatchPaused({ point, time }) {
    store.dispatch(actions.setPauseExecutionPoint(point, time));
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

        this.queuedMessageAdds = [];

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
