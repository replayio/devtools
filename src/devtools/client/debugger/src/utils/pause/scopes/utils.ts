/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { ValueFront } from "protocol/thread/value";
import { Item, ValueItem } from "devtools/packages/devtools-reps";

export function getFramePopVariables(why: any, path: string) {
  const vars = [];

  if (why && why.frameFinished) {
    const { frameFinished } = why;

    // Always display a `throw` property if present, even if it is falsy.
    if (Object.prototype.hasOwnProperty.call(frameFinished, "throw")) {
      vars.push(
        new ValueItem({
          name: "<exception>",
          path: `${path}/<exception>`,
          contents: frameFinished.throw,
        })
      );
    }

    if (Object.prototype.hasOwnProperty.call(frameFinished, "return")) {
      const returned = frameFinished.return;

      // Do not display undefined. Do display falsy values like 0 and false. The
      // protocol grip for undefined is a JSON object: { type: "undefined" }.
      if (typeof returned !== "object" || returned.type !== "undefined") {
        vars.push(
          new ValueItem({
            name: "<return>",
            path: `${path}/<return>`,
            contents: returned,
          })
        );
      }
    }
  }

  return vars;
}

export function getThisVariable(this_: ValueFront, path: string) {
  if (!this_) {
    return null;
  }

  return new ValueItem({
    name: "<this>",
    path: `${path}/<this>`,
    contents: this_,
  });
}

// Get a string path for an scope item which can be used in different pauses for
// a thread.
export function getScopeItemPath(item: Item) {
  // Calling toString() on item.path allows symbols to be handled.
  return item.path.toString();
}
