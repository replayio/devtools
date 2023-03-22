import { getSourceOutlineResult } from "@replayio/protocol";

const symbols: getSourceOutlineResult = {
  functions: [
    {
      name: "filterOutlineItem",
      location: { begin: { line: 36, column: 26 }, end: { line: 48, column: 1 } },
      parameters: ["name", "filter"],
    },
    {
      name: "isVisible",
      location: { begin: { line: 51, column: 0 }, end: { line: 57, column: 1 } },
      parameters: ["element", "parent"],
    },
    {
      name: "constructor",
      className: "Outline",
      location: { begin: { line: 62, column: 2 }, end: { line: 66, column: 3 } },
      parameters: ["props"],
    },
    {
      name: "componentDidUpdate",
      className: "Outline",
      location: { begin: { line: 68, column: 2 }, end: { line: 87, column: 3 } },
      parameters: ["prevProps", "prevState"],
    },
    {
      name: "setFocus",
      className: "Outline",
      location: { begin: { line: 89, column: 2 }, end: { line: 94, column: 3 } },
      parameters: ["cursorPosition"],
    },
    {
      name: "selectItem",
      className: "Outline",
      location: { begin: { line: 96, column: 2 }, end: { line: 109, column: 3 } },
      parameters: ["selectedItem"],
    },
    {
      name: "onContextMenu",
      className: "Outline",
      location: { begin: { line: 111, column: 2 }, end: { line: 143, column: 3 } },
      parameters: ["event", "func"],
    },
    {
      name: "click",
      className: "Outline",
      location: { begin: { line: 132, column: 13 }, end: { line: 139, column: 7 } },
      parameters: [],
    },
    {
      name: "updateFilter",
      className: "Outline",
      location: { begin: { line: 145, column: 17 }, end: { line: 147, column: 3 } },
      parameters: ["filter"],
    },
    {
      name: "renderPlaceholder",
      className: "Outline",
      location: { begin: { line: 149, column: 2 }, end: { line: 153, column: 3 } },
      parameters: [],
    },
    {
      name: "renderLoading",
      className: "Outline",
      location: { begin: { line: 155, column: 2 }, end: { line: 163, column: 3 } },
      parameters: [],
    },
    {
      name: "renderFunction",
      className: "Outline",
      location: { begin: { line: 165, column: 2 }, end: { line: 191, column: 3 } },
      parameters: ["func"],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 174, column: 13 }, end: { line: 178, column: 9 } },
      parameters: ["el"],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 179, column: 17 }, end: { line: 182, column: 9 } },
      parameters: [],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 183, column: 23 }, end: { line: 183, column: 55 } },
      parameters: ["e"],
    },
    {
      name: "renderClassHeader",
      className: "Outline",
      location: { begin: { line: 193, column: 2 }, end: { line: 199, column: 3 } },
      parameters: ["className"],
    },
    {
      name: "renderClassFunctions",
      className: "Outline",
      location: { begin: { line: 201, column: 2 }, end: { line: 237, column: 3 } },
      parameters: ["className", "functions"],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 209, column: 37 }, end: { line: 209, column: 64 } },
      parameters: ["func"],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 210, column: 44 }, end: { line: 210, column: 72 } },
      parameters: ["func"],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 211, column: 43 }, end: { line: 211, column: 64 } },
      parameters: ["c"],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 219, column: 13 }, end: { line: 223, column: 9 } },
      parameters: ["el"],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 228, column: 19 }, end: { line: 228, column: 46 } },
      parameters: [],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 233, column: 30 }, end: { line: 233, column: 63 } },
      parameters: ["func"],
    },
    {
      name: "renderFunctions",
      className: "Outline",
      location: { begin: { line: 239, column: 2 }, end: { line: 262, column: 3 } },
      parameters: ["functions"],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 241, column: 37 }, end: { line: 241, column: 55 } },
      parameters: ["func"],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 243, column: 6 }, end: { line: 243, column: 97 } },
      parameters: ["func"],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 247, column: 6 }, end: { line: 247, column: 66 } },
      parameters: ["func"],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 258, column: 28 }, end: { line: 258, column: 61 } },
      parameters: ["func"],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 259, column: 21 }, end: { line: 259, column: 78 } },
      parameters: ["className"],
    },
    {
      name: "testing",
      className: "Test",
      location: { begin: { line: 259, column: 21 }, end: { line: 259, column: 78 } },
      parameters: ["className"],
    },
    {
      name: "renderFooter",
      className: "Outline",
      location: { begin: { line: 264, column: 2 }, end: { line: 277, column: 3 } },
      parameters: [],
    },
    {
      name: "render",
      className: "Outline",
      location: { begin: { line: 279, column: 2 }, end: { line: 306, column: 3 } },
      parameters: [],
    },
    {
      name: "anonymous",
      className: "Outline",
      location: { begin: { line: 291, column: 54 }, end: { line: 291, column: 86 } },
      parameters: ["func"],
    },
    {
      name: "mapStateToProps",
      location: { begin: { line: 309, column: 24 }, end: { line: 326, column: 1 } },
      parameters: ["state"],
    },
    {
      name: "getFunctionText",
      location: { begin: { line: 318, column: 21 }, end: { line: 324, column: 5 } },
      parameters: ["line"],
    },
  ],
  classes: [
    {
      name: "Outline",
      location: { begin: { line: 59, column: 7 }, end: { line: 307, column: 1 } },
    },
    {
      name: "Test",
      location: { begin: { line: 59, column: 7 }, end: { line: 307, column: 1 } },
    },
  ],
};

export default symbols;
