/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import EventEmitter from "devtools/shared/event-emitter";
import actions from "devtools/client/webconsole/actions/index";
import { setupMessages } from "devtools/client/webconsole/actions/messages";
import { initOutputSyntaxHighlighting } from "devtools/client/webconsole/utils/syntax-highlighted";

export class WebConsolePanel {
  constructor(toolbox) {
    this.toolbox = toolbox;
    EventEmitter.decorate(this);
  }

  async open() {
    this.toolbox.on("webconsole-selected", this._onPanelSelected);
    this.toolbox.on("split-console", this._onChangeSplitConsoleState);
    this.toolbox.on("select", this._onChangeSplitConsoleState);

    initOutputSyntaxHighlighting();

    // TODO: the store should be associated with the toolbox
    setupMessages(store);
    this.store = store;
    return this;
  }

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
