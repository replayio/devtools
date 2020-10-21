/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Services = require("Services");

const EventEmitter = require("devtools/shared/event-emitter");

const { createElement, createFactory } = require("react");
const ReactDOM = require("react-dom");
const { Provider } = require("react-redux");
const { ThreadFront } = require("protocol/thread");
const { LogpointHandlers } = require("protocol/logpoint");

const actions = require("devtools/client/webconsole/actions/index");
const selectors = require("devtools/client/webconsole/selectors/index");
const { configureStore } = require("devtools/client/webconsole/store");
const { setupConsoleHelper } = require("ui/utils/bootstrap/helpers");

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

/**
 * A WebConsole instance is an interactive console initialized *per target*
 * that displays console log data as well as provides an interactive terminal to
 * manipulate the target's document content.
 *
 * This object only wraps the iframe that holds the Web Console UI. This is
 * meant to be an integration point between the Firefox UI and the Web Console
 * UI and features.
 */
class WebConsole {
  /*
   * @constructor
   * @param object toolbox
   *        The toolbox where the web console is displayed.
   */
  constructor(toolbox) {
    this.toolbox = toolbox;
    this.document = document;

    this.queuedMessageAdds = [];
    this.throttledDispatchPromise = null;

    EventEmitter.decorate(this);
  }

  async init() {
    this.document = window.document;
    this.rootElement = this.document.documentElement;

    this._initOutputSyntaxHighlighting();

    this.store = configureStore(this, {
      thunkArgs: {
        hud: this,
        toolbox: this.toolbox,
      },
    });

    LogpointHandlers.onPointLoading = this.onLogpointLoading;
    LogpointHandlers.onResult = this.onLogpointResult;
    LogpointHandlers.clearLogpoint = this.clearLogpoint;
    ThreadFront.findConsoleMessages(this.onConsoleMessage);
    this.toolbox.on("webconsole-selected", this._onPanelSelected);
    this.toolbox.on("split-console", this._onChangeSplitConsoleState);
    this.toolbox.on("select", this._onChangeSplitConsoleState);
    ThreadFront.on("paused", this.dispatchPaused);
    ThreadFront.on("instantWarp", this.dispatchPaused);

    const root = this.document.getElementById("toolbox-content-console");

    // Render the root Application component.
    this.body = renderApp({
      app: App(),
      store: this.store,
      root,
    });

    this.outputNode = this.document.getElementById("toolbox-content-console");
    setupConsoleHelper({ store, selectors, actions });
  }

  _initOutputSyntaxHighlighting() {
    // Given a DOM node, we syntax highlight identically to how the input field
    // looks. See https://codemirror.net/demo/runmode.html;
    const syntaxHighlightNode = node => {
      const editor = window.jsterm.editor;
      if (node && editor) {
        node.classList.add("cm-s-mozilla");
        editor.CodeMirror.runMode(node.textContent, "application/javascript", node);
      }
    };

    // Use a Custom Element to handle syntax highlighting to avoid
    // dealing with refs or innerHTML from React.
    customElements.define(
      "syntax-highlighted",
      class extends HTMLElement {
        connectedCallback() {
          if (!this.connected) {
            this.connected = true;
            syntaxHighlightNode(this);
          }
        }
      }
    );
  }

  /**
   * Sets the focus to JavaScript input field when the web console tab is
   * selected or when there is a split console present.
   * @private
   */
  _onPanelSelected = () => {
    // We can only focus when we have the jsterm reference. This is fine because if the
    // jsterm is not mounted yet, it will be focused in JSTerm's componentDidMount.
    window.jsterm.focus();
  };

  _onChangeSplitConsoleState = selectedPanel => {
    const shouldDisplayButton = selectedPanel !== "console";
    this.store.dispatch(actions.splitConsoleCloseButtonToggle(shouldDisplayButton));
  };

  getJsTermTooltipAnchor() {
    return this.outputNode.querySelector(".CodeMirror-cursor");
  }

  attachRef(id, node) {
    this[id] = node;
  }

  // Retrieves the debugger's currently selected frame front
  async getFrameActor() {
    const panel = this.toolbox.getPanel("debugger");
    const state = panel?.getFrames();
    const frame = state?.frames[state?.selected];

    if (!frame) {
      return null;
    }

    return frame.protocolId;
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
    this.store.dispatch(actions.messagesClearLogpoint(logGroupId));
  };

  subscribeToStore(callback) {
    this.store.subscribe(() => callback(this.store.getState()));
  }

  dispatchMessageAdd(packet) {
    this.batchedMessagesAdd([packet]);
  }

  dispatchPaused = ({ point, time }) => {
    this.store.dispatch(actions.setPauseExecutionPoint(point, time));
  };

  batchedMessagesAdd(messages) {
    this.queuedMessageAdds = this.queuedMessageAdds.concat(messages);
    this.setTimeoutIfNeeded();
  }

  /**
   *
   * @param {String} expression: The expression to evaluate
   */
  dispatchEvaluateExpression(expression) {
    this.store.dispatch(actions.evaluateExpression(expression));
  }

  setZoomedRegion({ startTime, endTime, scale }) {
    this.store.dispatch(actions.setZoomedRegion(startTime, endTime, scale));
  }

  setTimeoutIfNeeded() {
    if (this.throttledDispatchPromise) {
      return this.throttledDispatchPromise;
    }
    this.throttledDispatchPromise = new Promise(done => {
      setTimeout(async () => {
        this.throttledDispatchPromise = null;
        this.store.dispatch(actions.messagesAdd(this.queuedMessageAdds));

        this.queuedMessageAdds = [];

        done();
      }, 50);
    });
    return this.throttledDispatchPromise;
  }
}

module.exports = WebConsole;
