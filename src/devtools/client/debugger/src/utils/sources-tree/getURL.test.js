/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { makeMockSource } from "devtools/client/debugger/src/utils/test-mockup";

import { getURL } from "./getURL";

function createMockSource(props) {
  const rv = {
    ...makeMockSource(),
    ...Object.assign(
      {
        id: "server1.conn13.child1/39",
        isBlackBoxed: false,
        isPrettyPrinted: false,
        sourceMapURL: "",
        url: "",
      },
      props
    ),
  };
  return rv;
}

describe("getUrl", () => {
  it("handles normal url with http and https for filename", function () {
    const urlObject = getURL(createMockSource({ url: "https://a/b.js" }));
    expect(urlObject.filename).toBe("b.js");

    const urlObject2 = getURL(
      createMockSource({ id: "server1.conn13.child1/40", url: "http://a/b.js" })
    );
    expect(urlObject2.filename).toBe("b.js");
  });

  it("handles url with querystring for filename", function () {
    const urlObject = getURL(
      createMockSource({
        url: "https://a/b.js?key=randomKey",
      })
    );
    expect(urlObject.filename).toBe("b.js");
  });

  it("handles url with '#' for filename", function () {
    const urlObject = getURL(
      createMockSource({
        url: "https://a/b.js#specialSection",
      })
    );
    expect(urlObject.filename).toBe("b.js");
  });

  it("handles url with no file extension for filename", function () {
    const urlObject = getURL(
      createMockSource({
        id: "c",
        url: "https://a/c",
      })
    );
    expect(urlObject.filename).toBe("c");
  });

  it("handles url with no name for filename", function () {
    const urlObject = getURL(
      createMockSource({
        id: "c",
        url: "https://a/",
      })
    );
    expect(urlObject.filename).toBe("(index)");
  });

  it("separates resources by protocol and host", () => {
    const urlObject = getURL(
      createMockSource({
        id: "c2",
        url: "moz-extension://xyz/123",
      })
    );
    expect(urlObject.group).toBe("moz-extension://xyz");
  });

  it("creates a group name for webpack", () => {
    const urlObject = getURL(
      createMockSource({
        id: "c3",
        url: "webpack:///src/component.jsx",
      })
    );
    expect(urlObject.group).toBe("webpack://");
  });

  it("creates a group name for angular source", () => {
    const urlObject = getURL(
      createMockSource({
        id: "c3",
        url: "ng://src/component.jsx",
      })
    );
    expect(urlObject.group).toBe("ng://");
  });
});
