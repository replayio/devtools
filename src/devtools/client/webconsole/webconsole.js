/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Services = require("Services");
const { WebConsoleUI } = require("devtools/client/webconsole/webconsole-ui");
const EventEmitter = require("devtools/shared/event-emitter");
const Telemetry = require("devtools/client/shared/telemetry");
const { openDocLink } = require("devtools/client/shared/link");
const { ThreadFront, createPrimitiveValueFront } = require("protocol/thread");

const isMacOS = Services.appinfo.OS === "Darwin";

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
    this.toolbox.webconsoleHud = this;
    this.telemetry = new Telemetry();

    this.ui = new WebConsoleUI(this);
    this._destroyer = null;

    EventEmitter.decorate(this);
  }

  /**
   * Initialize the Web Console instance.
   *
   * @param {Boolean} emitCreatedEvent: Defaults to true. If false is passed,
   *        We won't be sending the 'web-console-created' event.
   *
   * @return object
   *         A promise for the initialization.
   */
  async init(emitCreatedEvent = true) {
    await this.ui.init();
  }

  /**
   * The JSTerm object that manages the console's input.
   * @see webconsole.js::JSTerm
   * @type object
   */
  get jsterm() {
    return this.ui ? this.ui.jsterm : null;
  }

  /**
   * Get the value from the input field.
   * @returns {String|null} returns null if there's no input.
   */
  getInputValue() {
    if (!this.jsterm) {
      return null;
    }

    return this.jsterm._getValue();
  }

  inputHasSelection() {
    const { editor } = this.jsterm || {};
    return editor && !!editor.getSelection();
  }

  getInputSelection() {
    if (!this.jsterm || !this.jsterm.editor) {
      return null;
    }
    return this.jsterm.editor.getSelection();
  }

  /**
   * Sets the value of the input field (command line)
   *
   * @param {String} newValue: The new value to set.
   */
  setInputValue(newValue) {
    if (!this.jsterm) {
      return;
    }

    this.jsterm._setValue(newValue);
  }

  evaluateInput(value) {
    this.jsterm._setValue(value);
    this.jsterm._execute();
  }

  focusInput() {
    return this.jsterm && this.jsterm.focus();
  }

  /**
   * Open a link in a new tab.
   *
   * @param string link
   *        The URL you want to open in a new tab.
   */
  openLink(link, e = {}) {
    openDocLink(link, {
      relatedToCurrent: true,
      inBackground: isMacOS ? e.metaKey : e.ctrlKey,
    });
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }
  }

  /**
   * Open a link in Firefox's view source.
   *
   * @param string sourceURL
   *        The URL of the file.
   * @param integer sourceLine
   *        The line number which should be highlighted.
   */
  viewSource(sourceURL, sourceLine) {
    this.gViewSourceUtils.viewSource({
      URL: sourceURL,
      lineNumber: sourceLine || 0,
    });
  }

  /**
   * Tries to open a JavaScript file related to the web page for the web console
   * instance in the Script Debugger. If the file is not found, it is opened in
   * source view instead.
   *
   *
   * @param string sourceURL
   *        The URL of the file.
   * @param integer sourceLine
   *        The line number which you want to place the caret.
   * @param integer sourceColumn
   *        The column number which you want to place the caret.
   */
  async viewSourceInDebugger(sourceURL, sourceLine, sourceColumn) {
    await this.toolbox.viewSourceInDebugger(sourceURL, sourceLine, sourceColumn);
  }

  /**
   * Retrieve information about the JavaScript debugger's stackframes list. This
   * is used to allow the Web Console to evaluate code in the selected
   * stackframe.
   *
   * @return object|null
   *         An object which holds:
   *         - frames: the active ThreadFront.cachedFrames array.
   *         - selected: depth/index of the selected stackframe in the debugger
   *         UI.
   *         If the debugger is not open or if it's not paused, then |null| is
   *         returned.
   */
  getDebuggerFrames() {
    const toolbox = this.toolbox;

    const panel = toolbox.getPanel("debugger");

    if (!panel) {
      return null;
    }

    return panel.getFrames();
  }

  get parserService() {
    if (this._parserService) {
      return this._parserService;
    }

    const { ParserDispatcher } = require("devtools/client/debugger/src/workers/parser/index");

    this._parserService = new ParserDispatcher();
    this._parserService.start(
      "resource://devtools/client/debugger/dist/parser-worker.js",
      this.chromeUtilsWindow
    );
    return this._parserService;
  }

  /**
   * Retrieves the current selection from the Inspector, if such a selection
   * exists. This is used to pass the ID of the selected actor to the Web
   * Console server for the $0 helper.
   *
   * @return object|null
   *         A Selection referring to the currently selected node in the
   *         Inspector.
   *         If the inspector was never opened, or no node was ever selected,
   *         then |null| is returned.
   */
  getInspectorSelection() {
    const toolbox = this.toolbox;

    const panel = toolbox.getPanel("inspector");
    if (!panel || !panel.selection) {
      return null;
    }
    return panel.selection;
  }

  async onViewSourceInDebugger(frame) {
    await this.toolbox.viewSourceInDebugger(frame.url, frame.line, frame.column, frame.scriptId);
  }

  getHighlighter() {
    if (this._highlighter) {
      return this._highlighter;
    }

    this._highlighter = this.toolbox.getHighlighter();
    return this._highlighter;
  }

  async openNodeInInspector(grip) {
    if (!this.toolbox) {
      return;
    }

    const onSelectInspector = this.toolbox.selectTool("inspector", "inspect_dom");

    const onNodeFront = this.toolbox.target
      .getFront("inspector")
      .then(inspectorFront => inspectorFront.getNodeFrontFromNodeGrip(grip));

    const [nodeFront, inspectorPanel] = await Promise.all([onNodeFront, onSelectInspector]);

    const onInspectorUpdated = inspectorPanel.once("inspector-updated");
    const onNodeFrontSet = this.toolbox.selection.setNodeFront(nodeFront, {
      reason: "console",
    });

    await Promise.all([onNodeFrontSet, onInspectorUpdated]);
  }

  /**
   * Evaluate a JavaScript expression asynchronously.
   *
   * @param {String} string: The code you want to evaluate.
   * @param {Object} options: Options for evaluation. See evaluateJSAsync method on
   *                          devtools/shared/fronts/webconsole.js
   */
  async evaluateJSAsync(expression, options = {}) {
    const { frameActor } = options;
    const rv = await ThreadFront.evaluate(/* asyncIndex */ 0, frameActor, expression);
    const { returned, exception, failed } = rv;

    let v;
    if (failed) {
      v = createPrimitiveValueFront("Error: Evaluation failed");
    } else if (returned) {
      v = returned;
    } else {
      v = exception;
    }

    return {
      type: "evaluationResult",
      result: v,
    };
  }

  destroy() {}
}

module.exports = WebConsole;
