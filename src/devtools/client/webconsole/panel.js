/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const WebConsole = require("./webconsole");
const EventEmitter = require("devtools/shared/event-emitter");
const { defer } = require("protocol/utils");

/**
 * A DevToolPanel that controls the Web Console.
 */
function WebConsolePanel(toolbox) {
  this._frameWindow = window;
  this._toolbox = toolbox;
  EventEmitter.decorate(this);

  this.readyWaiter = defer();
}

exports.WebConsolePanel = WebConsolePanel;

WebConsolePanel.prototype = {
  hud: null,

  /**
   * Called by the WebConsole's onkey command handler.
   * If the WebConsole is opened, check if the JSTerm's input line has focus.
   * If not, focus it.
   */
  focusInput: function () {
    this.hud.jsterm.focus();
  },

  /**
   * Open is effectively an asynchronous constructor.
   *
   * @return object
   *         A promise that is resolved when the Web Console completes opening.
   */
  open: async function () {
    try {
      // Open the Web Console.
      this.hud = new WebConsole(this._toolbox);
      await this.hud.init();

      this._isReady = true;
      this.readyWaiter.resolve();
      this.emit("ready");
    } catch (e) {
      console.error(`WebConsolePanel open failed. ${e.error}: ${e.message}`, e);
    }

    return this;
  },

  get currentTarget() {
    return this._toolbox.target;
  },

  _isReady: false,
  get isReady() {
    return this._isReady;
  },

  destroy: function () {
    if (!this._toolbox) {
      return;
    }
    this.hud.destroy();
    this.hud = null;
    this._frameWindow = null;
    this._toolbox = null;
    this.emit("destroyed");
  },
};
