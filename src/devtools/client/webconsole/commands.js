/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { createPrimitiveValueFront } = require("protocol/thread");

class ConsoleCommands {
  constructor({ devToolsClient, hud, threadFront }) {
    this.devToolsClient = devToolsClient;
    this.hud = hud;
    this.threadFront = threadFront;
  }

  getFrontByID(id) {
    return this.devToolsClient.getFrontByID(id);
  }

  async evaluateJSAsync(expression, options = {}) {
    const { frameActor } = options;
    const rv = await this.threadFront.evaluate(/* asyncIndex */ 0, frameActor, expression);
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

  timeWarp(executionPoint) {
    return this.threadFront.timeWarp(executionPoint);
  }
}

module.exports = ConsoleCommands;
