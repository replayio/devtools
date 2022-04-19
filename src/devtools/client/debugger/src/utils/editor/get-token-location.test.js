/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { getTokenLocation } from "./get-token-location";

describe("getTokenLocation", () => {
  const codemirror = {
    coordsChar: jest.fn(() => ({
      ch: "C",
      line: 1,
    })),
  };
  const token = {
    getBoundingClientRect() {
      return {
        height: 10,
        left: 10,
        top: 20,
        width: 10,
      };
    },
  };
  it("calls into codeMirror", () => {
    getTokenLocation(codemirror, token);
    expect(codemirror.coordsChar).toHaveBeenCalledWith({
      left: 15,
      top: 25,
    });
  });
});
