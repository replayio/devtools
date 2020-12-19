/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import EventEmitter from "devtools/shared/event-emitter";
import { setupMessages } from "devtools/client/webconsole/actions/messages";
import { initOutputSyntaxHighlighting } from "devtools/client/webconsole/utils/syntax-highlighted";

export class WebConsolePanel {
  constructor(toolbox) {
    this.toolbox = toolbox;
    EventEmitter.decorate(this);
  }

  async open() {
    initOutputSyntaxHighlighting();

    // TODO: the store should be associated with the toolbox
    setupMessages(store);
    this.store = store;
    return this;
  }

  destroy() {}
}
