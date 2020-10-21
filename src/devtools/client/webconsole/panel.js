/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { WebConsole } from "./webconsole";
import EventEmitter from "devtools/shared/event-emitter";
import actions from "devtools/client/webconsole/actions/index";

export class WebConsolePanel {
  constructor(toolbox) {
    this.toolbox = toolbox;
    EventEmitter.decorate(this);
  }

  async open() {
    this.hud = new WebConsole(this.toolbox);

    this.toolbox.on("webconsole-selected", this._onPanelSelected);
    this.toolbox.on("split-console", this._onChangeSplitConsoleState);
    this.toolbox.on("select", this._onChangeSplitConsoleState);

    const { store } = await this.hud.init();
    this.store = store;
    return this;
  }

  /**
   * Called by the WebConsole's onkey command handler.
   * If the WebConsole is opened, check if the JSTerm's input line has focus.
   * If not, focus it.
   */
  focusInput() {
    window.jsterm.focus();
  }

  subscribeToStore(callback) {
    this.store.subscribe(() => callback(this.store.getState()));
  }

  _onChangeSplitConsoleState = selectedPanel => {
    const shouldDisplayButton = selectedPanel !== "console";
    this.store.dispatch(actions.splitConsoleCloseButtonToggle(shouldDisplayButton));
  };

  _onPanelSelected = () => {
    window.jsterm?.focus();
  };

  evaluateExpression(expression) {
    this.store.dispatch(actions.evaluateExpression(expression));
  }

  setZoomedRegion({ startTime, endTime, scale }) {
    this.store.dispatch(actions.setZoomedRegion(startTime, endTime, scale));
  }

  destroy() {}
}
