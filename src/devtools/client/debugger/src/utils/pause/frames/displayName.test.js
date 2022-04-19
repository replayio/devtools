/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { makeMockFrame, makeMockSource } from "devtools/client/debugger/src/utils/test-mockup";

import { formatCopyName, formatDisplayName, simplifyDisplayName } from "./displayName";

describe("formatCopyName", () => {
  it("simple", () => {
    const source = makeMockSource("todo-view.js");
    const frame = makeMockFrame(undefined, source, undefined, 12, "child");

    expect(formatCopyName(frame)).toEqual("child (todo-view.js#12)");
  });
});

describe("formatting display names", () => {
  it("uses a library description", () => {
    const source = makeMockSource("assets/backbone.js");
    const frame = {
      ...makeMockFrame(undefined, source, undefined, undefined, "extend/child"),
      library: "Backbone",
    };

    expect(formatDisplayName(frame, undefined)).toEqual("Create Class");
  });

  it("shortens an anonymous function", () => {
    const source = makeMockSource("assets/bar.js");
    const frame = makeMockFrame(undefined, source, undefined, undefined, "extend/child/bar/baz");

    expect(formatDisplayName(frame, undefined)).toEqual("baz");
  });

  it("does not truncates long function names", () => {
    const source = makeMockSource("extend/child/bar/baz");
    const frame = makeMockFrame(
      undefined,
      source,
      undefined,
      undefined,
      "bazbazbazbazbazbazbazbazbazbazbazbazbaz"
    );

    expect(formatDisplayName(frame, undefined)).toEqual("bazbazbazbazbazbazbazbazbazbazbazbazbaz");
  });

  it("returns the original function name when present", () => {
    const source = makeMockSource("entry.js");
    const frame = {
      ...makeMockFrame(undefined, source),
      displayName: "fn",
      originalDisplayName: "originalFn",
    };

    expect(formatDisplayName(frame, undefined)).toEqual("originalFn");
  });

  it("returns anonymous when displayName is undefined", () => {
    const frame = { ...makeMockFrame(), displayName: undefined };
    expect(formatDisplayName(frame, undefined)).toEqual("<anonymous>");
  });

  it("returns anonymous when displayName is null", () => {
    const frame = { ...makeMockFrame(), displayName: null };
    expect(formatDisplayName(frame, undefined)).toEqual("<anonymous>");
  });

  it("returns anonymous when displayName is an empty string", () => {
    const frame = { ...makeMockFrame(), displayName: "" };
    expect(formatDisplayName(frame, undefined)).toEqual("<anonymous>");
  });
});

describe("simplifying display names", () => {
  const cases = {
    annonymousProperty: [["jQuery.each(^)", "each"]],

    arrayProperty: [
      ["this.eventPool_[createObject]", "createObject"],
      ["jQuery.each(^)/jQuery.fn[o]", "o"],
      ["viewport[get+D]", "get+D"],
      ["arr[0]", "0"],
    ],

    defaultCase: [["define", "define"]],

    functionProperty: [
      ["fromYUI._attach/<.", "_attach"],
      ["Y.ClassNameManager<", "ClassNameManager"],
      ["fromExtJS.setVisible/cb<", "cb"],
      ["fromDojo.registerWin/<", "registerWin"],
    ],

    objectProperty: [
      ["z.foz", "foz"],
      ["z.foz/baz", "baz"],
      ["z.foz/baz/y.bay", "bay"],
      ["outer/x.fox.bax.nx", "nx"],
      ["outer/fow.baw", "baw"],
      ["fromYUI._attach", "_attach"],
      ["Y.ClassNameManager</getClassName", "getClassName"],
      ["orion.textview.TextView</addHandler", "addHandler"],
      ["this.eventPool_.createObject", "createObject"],
    ],
  };

  Object.keys(cases).forEach(type => {
    cases[type].forEach(([kase, expected]) => {
      it(`${type} - ${kase}`, () => expect(simplifyDisplayName(kase)).toEqual(expected));
    });
  });
});
