/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// 

import { WorkerDispatcher } from "devtools-utils/src/worker-utils";


const { log } = require("protocol/socket");

export class ParserDispatcher extends WorkerDispatcher {
  async findOutOfScopeLocations(sourceId, position) {
    log(`WorkerDispatch Parser findOutOfScopeLocations`);
    return this.invoke("findOutOfScopeLocations", sourceId, position);
  }

  async getNextStep(sourceId, pausedPosition) {
    log(`WorkerDispatch Parser getNextStep`);
    return this.invoke("getNextStep", sourceId, pausedPosition);
  }

  async clearState() {
    log(`WorkerDispatch Parser clearState`);
    return this.invoke("clearState");
  }

  async getScopes(location) {
    log(`WorkerDispatch Parser getScopes`);
    return this.invoke("getScopes", location);
  }

  async getSymbols(sourceId) {
    log(`WorkerDispatch Parser getSymbols`);
    return this.invoke("getSymbols", sourceId);
  }

  async setSource(sourceId, content) {
    const astSource = {
      id: sourceId,
      text: content.type === "wasm" ? "" : content.value,
      contentType: content.contentType || null,
      isWasm: content.type === "wasm",
    };

    log(`WorkerDispatch Parser setSource`);
    return this.invoke("setSource", astSource);
  }

  async hasSyntaxError(input) {
    log(`WorkerDispatch Parser hasSyntaxError`);
    return this.invoke("hasSyntaxError", input);
  }

  async mapExpression(
    expression,
    mappings,
    bindings,
    shouldMapBindings,
    shouldMapAwait
  ) {
    log(`WorkerDispatch Parser mapExpression`);
    return this.invoke(
      "mapExpression",
      expression,
      mappings,
      bindings,
      shouldMapBindings,
      shouldMapAwait
    );
  }

  async clear() {
    await this.clearState();
  }
}



