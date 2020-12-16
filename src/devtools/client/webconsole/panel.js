/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import EventEmitter from "devtools/shared/event-emitter";
import { initOutputSyntaxHighlighting } from "devtools/client/webconsole/utils/syntax-highlighted";

export class WebConsolePanel {
  constructor(toolbox) {
    this.toolbox = toolbox;
    EventEmitter.decorate(this);
  }

  async open() {
    initOutputSyntaxHighlighting();
    return this;
  }

  focusInput() {
    window.jsterm.focus();
  }

  destroy() {}
}
