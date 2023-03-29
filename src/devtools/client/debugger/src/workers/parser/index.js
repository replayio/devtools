/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { WorkerDispatcher } from "devtools/shared/worker-utils";

export class ParserDispatcher extends WorkerDispatcher {
  async clearState() {
    return this.invoke("clearState");
  }

  async getSymbols(sourceId) {
    return this.invoke("getSymbols", sourceId);
  }

  async setSource(sourceId, content) {
    const astSource = {
      id: sourceId,
      text: content.value,
      contentType: content.contentType || null,
    };

    return this.invoke("setSource", astSource);
  }

  async hasSyntaxError(input) {
    return this.invoke("hasSyntaxError", input);
  }

  async clear() {
    await this.clearState();
  }
}
