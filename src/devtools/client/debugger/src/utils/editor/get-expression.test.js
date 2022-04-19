/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import CodeMirror from "codemirror";

import { getExpressionFromCoords } from "./get-expression";

describe("get-expression", () => {
  let isCreateTextRangeDefined;

  beforeAll(() => {
    if (document.body.createTextRange) {
      isCreateTextRangeDefined = true;
    } else {
      isCreateTextRangeDefined = false;
      // CodeMirror needs createTextRange
      // https://discuss.codemirror.net/t/working-in-jsdom-or-node-js-natively/138/5
      document.body.createTextRange = () => ({
        getBoundingClientRect: jest.fn(),
        getClientRects: () => ({}),
      });
    }
  });

  afterAll(() => {
    if (!isCreateTextRangeDefined) {
      delete document.body.createTextRange;
    }
  });

  describe("getExpressionFromCoords", () => {
    xit("returns null when location.line is greater than the lineCount", () => {
      const cm = CodeMirror(document.body, {
        mode: "javascript",
        value: "let Line1;\n" + "let Line2;\n",
      });

      const result = getExpressionFromCoords(cm, {
        column: 1,
        line: 3,
      });
      expect(result).toBeNull();
    });

    xit("gets the expression using CodeMirror.getTokenAt", () => {
      const codemirrorMock = {
        doc: {
          getLine: () => "",
        },
        getTokenAt: jest.fn(() => ({ end: 0, start: 0 })),
        lineCount: () => 100,
      };
      getExpressionFromCoords(codemirrorMock, { column: 1, line: 1 });
      expect(codemirrorMock.getTokenAt).toHaveBeenCalled();
    });

    xit("requests the correct line and column from codeMirror", () => {
      const codemirrorMock = {
        doc: {
          getLine: jest.fn(() => ""),
        },
        getTokenAt: jest.fn(() => ({ end: 1, start: 0 })),
        lineCount: () => 100,
      };
      getExpressionFromCoords(codemirrorMock, { column: 5, line: 20 });
      // getExpressionsFromCoords uses one based line indexing
      // CodeMirror uses zero based line indexing
      expect(codemirrorMock.getTokenAt).toHaveBeenCalledWith({
        ch: 5,
        line: 19,
      });
      expect(codemirrorMock.doc.getLine).toHaveBeenCalledWith(19);
    });

    xit("when called with column 0 returns null", () => {
      const cm = CodeMirror(document.body, {
        mode: "javascript",
        value: "foo bar;\n",
      });

      const result = getExpressionFromCoords(cm, {
        column: 0,
        line: 1,
      });
      expect(result).toBeNull();
    });

    xit("gets the expression when first token on the line", () => {
      const cm = CodeMirror(document.body, {
        mode: "javascript",
        value: "foo bar;\n",
      });

      const result = getExpressionFromCoords(cm, {
        column: 1,
        line: 1,
      });
      if (!result) {
        throw new Error("no result");
      }
      expect(result.expression).toEqual("foo");
      expect(result.location.start).toEqual({ column: 0, line: 1 });
      expect(result.location.end).toEqual({ column: 3, line: 1 });
    });

    xit("includes previous tokens in the expression", () => {
      const cm = CodeMirror(document.body, {
        mode: "javascript",
        value: "foo.bar;\n",
      });

      const result = getExpressionFromCoords(cm, {
        column: 5,
        line: 1,
      });
      if (!result) {
        throw new Error("no result");
      }
      expect(result.expression).toEqual("foo.bar");
      expect(result.location.start).toEqual({ column: 0, line: 1 });
      expect(result.location.end).toEqual({ column: 7, line: 1 });
    });

    xit("includes multiple previous tokens in the expression", () => {
      const cm = CodeMirror(document.body, {
        mode: "javascript",
        value: "foo.bar.baz;\n",
      });

      const result = getExpressionFromCoords(cm, {
        column: 10,
        line: 1,
      });
      if (!result) {
        throw new Error("no result");
      }
      expect(result.expression).toEqual("foo.bar.baz");
      expect(result.location.start).toEqual({ column: 0, line: 1 });
      expect(result.location.end).toEqual({ column: 11, line: 1 });
    });

    xit("does not include tokens not part of the expression", () => {
      const cm = CodeMirror(document.body, {
        mode: "javascript",
        value: "foo bar.baz;\n",
      });

      const result = getExpressionFromCoords(cm, {
        column: 10,
        line: 1,
      });
      if (!result) {
        throw new Error("no result");
      }
      expect(result.expression).toEqual("bar.baz");
      expect(result.location.start).toEqual({ column: 4, line: 1 });
      expect(result.location.end).toEqual({ column: 11, line: 1 });
    });
  });
});
