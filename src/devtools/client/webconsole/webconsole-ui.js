/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const EventEmitter = require("devtools/shared/event-emitter");
const KeyShortcuts = require("devtools/client/shared/key-shortcuts");
const { l10n } = require("devtools/client/webconsole/utils/messages");

const ConsoleCommands = require("devtools/client/webconsole/commands.js");

/**
 * A WebConsoleUI instance is an interactive console initialized *per target*
 * that displays console log data as well as provides an interactive terminal to
 * manipulate the target's document content.
 *
 * The WebConsoleUI is responsible for the actual Web Console UI
 * implementation.
 */
class WebConsoleUI {
  /*
   * @param {WebConsole} hud: The WebConsole owner object.
   */
  constructor(hud) {
    this.hud = hud;

    EventEmitter.decorate(this);
  }

  /**
   * Initialize the WebConsoleUI instance.
   * @return object
   *         A promise object that resolves once the frame is ready to use.
   */
  init() {
    if (this._initializer) {
      return this._initializer;
    }

    this._initializer = (async () => {
      this._initUI();

      await this.wrapper.init();
    })();

    return this._initializer;
  }

  destroy() {}

  /**
   * Clear the Web Console output.
   *
   * This method emits the "messages-cleared" notification.
   *
   * @param boolean clearStorage
   *        True if you want to clear the console messages storage associated to
   *        this Web Console.
   * @param object event
   *        If the event exists, calls preventDefault on it.
   */
  clearOutput(clearStorage, event) {
    if (event) {
      event.preventDefault();
    }
    this.wrapper.dispatchMessagesClear();
  }

  _initUI() {
    this.document = window.document;
    this.rootElement = this.document.documentElement;

    this.outputNode = this.document.getElementById("toolbox-content-console");

    const toolbox = this.hud.toolbox;

    const WebConsoleWrapper = require("devtools/client/webconsole/webconsole-wrapper");

    this.wrapper = new WebConsoleWrapper(this.outputNode, this, toolbox, this.document);

    this._initShortcuts();
    this._initOutputSyntaxHighlighting();

    if (toolbox) {
      toolbox.on("webconsole-selected", this._onPanelSelected);
      toolbox.on("split-console", this._onChangeSplitConsoleState);
      toolbox.on("select", this._onChangeSplitConsoleState);
    }
  }

  _initOutputSyntaxHighlighting() {
    // Given a DOM node, we syntax highlight identically to how the input field
    // looks. See https://codemirror.net/demo/runmode.html;
    const syntaxHighlightNode = node => {
      const editor = this.jsterm && this.jsterm.editor;
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

  _initShortcuts() {
    const shortcuts = new KeyShortcuts({ window });

    let clearShortcut;
    clearShortcut = l10n.getStr("webconsole.clear.key");

    shortcuts.on(clearShortcut, event => this.clearOutput(true, event));
  }

  /**
   * Sets the focus to JavaScript input field when the web console tab is
   * selected or when there is a split console present.
   * @private
   */
  _onPanelSelected = () => {
    // We can only focus when we have the jsterm reference. This is fine because if the
    // jsterm is not mounted yet, it will be focused in JSTerm's componentDidMount.
    if (this.jsterm) {
      this.jsterm.focus();
    }
  };

  _onChangeSplitConsoleState = selectedPanel => {
    this.wrapper.dispatchSplitConsoleCloseButtonToggle(selectedPanel);
  };

  getInputCursor() {
    return this.jsterm && this.jsterm.getSelectionStart();
  }

  getJsTermTooltipAnchor() {
    return this.outputNode.querySelector(".CodeMirror-cursor");
  }

  attachRef(id, node) {
    this[id] = node;
  }

  // Retrieves the debugger's currently selected frame front
  async getFrameActor() {
    const state = this.hud.getDebuggerFrames();
    if (!state) {
      return null;
    }

    const frame = state.frames[state.selected];

    if (!frame) {
      return null;
    }

    return frame.protocolId;
  }

  getSelectedNodeActor() {
    const front = this.getSelectedNodeFront();
    return front ? front.actorID : null;
  }

  getSelectedNodeFront() {
    const inspectorSelection = this.hud.getInspectorSelection();
    return inspectorSelection ? inspectorSelection.nodeFront : null;
  }

  onMessageHover(type, message) {
    this.emit("message-hover", type, message);
  }
}

exports.WebConsoleUI = WebConsoleUI;
