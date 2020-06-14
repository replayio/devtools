/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Services = require("Services");
const EventEmitter = require("devtools/shared/event-emitter");
const {
  WebConsoleConnectionProxy,
} = require("devtools/client/webconsole/webconsole-connection-proxy");
const KeyShortcuts = require("devtools/client/shared/key-shortcuts");
const { l10n } = require("devtools/client/webconsole/utils/messages");

const { getAdHocFrontOrPrimitiveGrip } = require("protocol/object");

const { constants } = require("devtools/client/webconsole/constants");

const {
  START_IGNORE_ACTION,
} = require("devtools/client/shared/redux/middleware/ignore");
const ConsoleCommands = require("devtools/client/webconsole/commands.js");

const ZoomKeys = require("devtools/client/shared/zoom-keys");

const PREF_SIDEBAR_ENABLED = "devtools.webconsole.sidebarToggle";

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
    this.window = window;
    this.hud = hud;
    this.hudId = this.hud.hudId;
    this.isBrowserConsole = this.hud.isBrowserConsole;

    this._onPanelSelected = this._onPanelSelected.bind(this);
    this._onChangeSplitConsoleState = this._onChangeSplitConsoleState.bind(
      this
    );
    this._onTargetDestroyed = this._onTargetDestroyed.bind(this);

    EventEmitter.decorate(this);

    this.proxy = new WebConsoleConnectionProxy(this);
  }

  /**
   * Getter for the WebConsoleFront.
   * @type object
   */
  get webConsoleFront() {
    const proxy = this.getProxy();

    if (!proxy) {
      return null;
    }

    return proxy.webConsoleFront;
  }

  /**
   * Return the main target proxy, i.e. the proxy for MainProcessTarget in BrowserConsole,
   * and the proxy for the target passed from the Toolbox to WebConsole.
   *
   * @returns {WebConsoleConnectionProxy}
   */
  getProxy() {
    return this.proxy;
  }

  /**
   * Return all the proxies we're currently managing (i.e. the "main" one, and the
   * possible additional ones).
   *
   * @param {Boolean} filterDisconnectedProxies: True by default, if false, this
   *   function also returns not-already-connected or already disconnected proxies.
   *
   * @returns {Array<WebConsoleConnectionProxy>}
   */
  getAllProxies(filterDisconnectedProxies = true) {
    let proxies = [this.getProxy()];

    if (this.additionalProxies) {
      proxies = proxies.concat([...this.additionalProxies.values()]);
    }

    // Ignore Fronts that are already destroyed
    if (filterDisconnectedProxies) {
      proxies = proxies.filter(proxy => {
        return (
          proxy && proxy.webConsoleFront && !!proxy.webConsoleFront.actorID
        );
      });
    }

    return proxies;
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
      await this._attachTargets();

      this._commands = new ConsoleCommands({
        proxy: this.getProxy(),
        hud: this.hud,
        threadFront: this.hud.toolbox && this.hud.toolbox.threadFront,
      });

      await this.wrapper.init();
    })();

    return this._initializer;
  }

  destroy() {
    if (!this.hud) {
      return;
    }

    this.React = this.ReactDOM = this.FrameView = null;

    if (this.wrapper) {
      this.wrapper.getStore().dispatch(START_IGNORE_ACTION);
    }

    if (this.outputNode) {
      // We do this because it's much faster than letting React handle the ConsoleOutput
      // unmounting.
      this.outputNode.innerHTML = "";
    }

    if (this.jsterm) {
      this.jsterm.destroy();
      this.jsterm = null;
    }

    const toolbox = this.hud.toolbox;
    if (toolbox) {
      toolbox.off("webconsole-selected", this._onPanelSelected);
      toolbox.off("split-console", this._onChangeSplitConsoleState);
      toolbox.off("select", this._onChangeSplitConsoleState);
    }

    for (const proxy of this.getAllProxies()) {
      proxy.disconnect();
    }
    this.proxy = null;
    this.additionalProxies = null;

    // Nullify `hud` last as it nullify also target which is used on destroy
    this.window = this.hud = this.wrapper = null;
  }

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
    if (this.wrapper) {
      this.wrapper.dispatchMessagesClear();
    }
    this.clearNetworkRequests();
    if (clearStorage) {
      this.clearMessagesCache();
    }
    this.emitForTests("messages-cleared");
  }

  clearNetworkRequests() {
    for (const proxy of this.getAllProxies()) {
      proxy.webConsoleFront.clearNetworkRequests();
    }
  }

  clearMessagesCache() {
    for (const proxy of this.getAllProxies()) {
      proxy.webConsoleFront.clearMessagesCache();
    }
  }

  /**
   * Remove all of the private messages from the Web Console output.
   *
   * This method emits the "private-messages-cleared" notification.
   */
  clearPrivateMessages() {
    if (this.wrapper) {
      this.wrapper.dispatchPrivateMessagesClear();
      this.emitForTests("private-messages-cleared");
    }
  }

  inspectObjectActor(objectActor) {
    const webConsoleFront = this.webConsoleFront;
    this.wrapper.dispatchMessageAdd(
      {
        helperResult: {
          type: "inspectObject",
          object:
            objectActor && objectActor.getGrip
              ? objectActor
              : getAdHocFrontOrPrimitiveGrip(objectActor, webConsoleFront),
        },
      },
      true
    );
    return this.wrapper;
  }

  getPanelWindow() {
    return this.window;
  }

  /**
   * Setter for saving of network request and response bodies.
   *
   * @param boolean value
   *        The new value you want to set.
   */
  async setSaveRequestAndResponseBodies(value) {
    if (!this.webConsoleFront) {
      // Don't continue if the webconsole disconnected.
      return null;
    }

    const newValue = !!value;
    const toSet = {
      "NetworkMonitor.saveRequestAndResponseBodies": newValue,
    };

    // Make sure the web console client connection is established first.
    return this.webConsoleFront.setPreferences(toSet);
  }

  /**
   * Connect to the server using the remote debugging protocol.
   *
   * @private
   * @return object
   *         A promise object that is resolved/reject based on the proxies connections.
   */
  async _attachTargets() {
    this.additionalProxies = new Map();
  }

  /**
   * Called any time a target has been destroyed.
   *
   * @private
   * See _onTargetAvailable for param's description.
   */
  _onTargetDestroyed({ type, targetFront, isTopLevel }) {
    if (isTopLevel) {
      this.proxy.disconnect();
      this.proxy = null;
    } else {
      const proxy = this.additionalProxies.get(targetFront);
      proxy.disconnect();
      this.additionalProxies.delete(targetFront);
    }
  }

  _initUI() {
    this.document = window.document;
    this.rootElement = this.document.documentElement;

    this.outputNode = this.document.getElementById("toolbox-content-console");

    const toolbox = this.hud.toolbox;

    const WebConsoleWrapper = require("devtools/client/webconsole/webconsole-wrapper");

    this.wrapper = new WebConsoleWrapper(
      this.outputNode,
      this,
      toolbox,
      this.document
    );

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
        editor.CodeMirror.runMode(
          node.textContent,
          "application/javascript",
          node
        );
      }
    };

    // Use a Custom Element to handle syntax highlighting to avoid
    // dealing with refs or innerHTML from React.
    const win = this.window;
    win.customElements.define(
      "syntax-highlighted",
      class extends win.HTMLElement {
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
    const shortcuts = new KeyShortcuts({
      window: this.window,
    });

    let clearShortcut;
    clearShortcut = l10n.getStr("webconsole.clear.key");

    shortcuts.on(clearShortcut, event => this.clearOutput(true, event));
  }

  getLongString(grip) {
    return this.getProxy().webConsoleFront.getString(grip);
  }

  /**
   * Sets the focus to JavaScript input field when the web console tab is
   * selected or when there is a split console present.
   * @private
   */
  _onPanelSelected() {
    // We can only focus when we have the jsterm reference. This is fine because if the
    // jsterm is not mounted yet, it will be focused in JSTerm's componentDidMount.
    if (this.jsterm) {
      this.jsterm.focus();
    }
  }

  _onChangeSplitConsoleState() {
    this.wrapper.dispatchSplitConsoleCloseButtonToggle();
  }

  /**
   * Handler for the tabNavigated notification.
   *
   * @param string event
   *        Event name.
   * @param object packet
   *        Notification packet received from the server.
   */
  async handleTabNavigated(packet) {
    if (!packet.nativeConsoleAPI) {
      this.logWarningAboutReplacedAPI();
    }

    // Wait for completion of any async dispatch before notifying that the console
    // is fully updated after a page reload
    await this.wrapper.waitAsyncDispatches();
    this.emit("reloaded");
  }

  handleTabWillNavigate(packet) {
    this.wrapper.dispatchTabWillNavigate(packet);
  }

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

    return frame.actor;
  }

  getWebconsoleFront({ frameActorId } = {}) {
    if (frameActorId) {
      const frameFront = this.hud.getFrontByID(frameActorId);
      if (!frameFront) {
        throw new Error("Missing frame front");
      }
      return frameFront.getWebConsoleFront();
    }

    if (!this.hud.toolbox) {
      return this.webConsoleFront;
    }

    const threadFront = this.hud.toolbox.getSelectedThreadFront();
    if (!threadFront) {
      return this.webConsoleFront;
    }

    return threadFront.getWebconsoleFront();
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
