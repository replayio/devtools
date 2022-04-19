/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import cases from "jest-in-case";

import { parseQuickOpenQuery, parseLineColumn } from "./quick-open";

cases(
  "parseQuickOpenQuery utility",
  ({ type, query }) => expect(parseQuickOpenQuery(query)).toEqual(type),
  [
    { name: "empty query defaults to sources", query: "", type: "sources" },
    { name: "sources query", query: "test", type: "sources" },
    { name: "functions query", query: "@test", type: "functions" },
    { name: "variables query", query: "#test", type: "variables" },
    { name: "goto line", query: ":30", type: "goto" },
    { name: "goto line:column", query: ":30:60", type: "goto" },
    { name: "goto source line", query: "test:30:60", type: "gotoSource" },
    { name: "shortcuts", query: "?", type: "shortcuts" },
  ]
);

cases(
  "parseLineColumn utility",
  ({ query, location }) => expect(parseLineColumn(query)).toEqual(location),
  [
    { location: undefined, name: "empty query", query: "" },
    { location: { line: 30 }, name: "just line", query: ":30" },
    {
      location: { column: 90, line: 30 },
      name: "line and column",
      query: ":30:90",
    },
  ]
);
