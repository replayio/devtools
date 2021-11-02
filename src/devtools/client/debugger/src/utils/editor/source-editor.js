/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

export const CodeMirror = require("codemirror");

require("codemirror/lib/codemirror.css");
require("codemirror/mode/javascript/javascript");
require("codemirror/mode/htmlmixed/htmlmixed");
require("codemirror/mode/coffeescript/coffeescript");
require("codemirror/mode/jsx/jsx");
require("codemirror/mode/elm/elm");
require("codemirror/mode/clojure/clojure");
require("codemirror/mode/haxe/haxe");
require("codemirror/addon/search/searchcursor");
require("codemirror/addon/runmode/runmode");
require("codemirror/addon/selection/active-line");
require("codemirror/addon/edit/matchbrackets");

// require("./source-editor.css");

// Maximum allowed margin (in number of lines) from top or bottom of the editor
// while shifting to a line which was initially out of view.
const MAX_VERTICAL_OFFSET = 3;

export default class Editor {
  opts;
  editor;

  constructor(opts) {
    this.opts = opts;
  }

  appendToLocalElement(node) {
    this.editor = CodeMirror(node, this.opts);
  }

  destroy() {
    // Unlink the current document.
    if (this.editor.doc) {
      this.editor.doc.cm = null;
    }
  }

  get codeMirror() {
    return this.editor;
  }

  get CodeMirror() {
    return CodeMirror;
  }

  focus() {
    this.editor.focus();
  }

  setText(str) {
    this.editor.setValue(str);
  }

  getText() {
    return this.editor.getValue();
  }

  getSelection() {
    return this.editor.getSelection();
  }

  setCursor({ line, ch }, align) {
    this.alignLine(line, align);
    this.editor.setCursor({ line: line, ch: ch });
  }

  setMode(value) {
    this.editor.setOption("mode", value);
  }

  /**
   * Replaces the current document with a new source document
   * @memberof utils/source-editor
   */
  replaceDocument(doc) {
    this.editor.swapDoc(doc);
  }

  /**
   * Creates a CodeMirror Document
   * @returns CodeMirror.Doc
   * @memberof utils/source-editor
   */
  createDocument() {
    return new CodeMirror.Doc("");
  }

  /**
   * Aligns the provided line to either "top", "center" or "bottom" of the
   * editor view with a maximum margin of MAX_VERTICAL_OFFSET lines from top or
   * bottom.
   * @memberof utils/source-editor
   */
  alignLine(line, align = "top") {
    const cm = this.editor;
    const editorClientRect = cm.getWrapperElement().getBoundingClientRect();

    const from = cm.lineAtHeight(editorClientRect.top, "page");
    const to = cm.lineAtHeight(editorClientRect.height + editorClientRect.top, "page");

    const linesVisible = to - from;
    const halfVisible = Math.round(linesVisible / 2);

    // If the target line is in view, skip the vertical alignment part.
    if (line <= to && line >= from) {
      return;
    }

    // Setting the offset so that the line always falls in the upper half
    // of visible lines (lower half for bottom aligned).
    // MAX_VERTICAL_OFFSET is the maximum allowed value.
    const offset = Math.min(halfVisible, MAX_VERTICAL_OFFSET);

    let topLine =
      {
        center: Math.max(line - halfVisible, 0),
        bottom: Math.max(line - linesVisible + offset, 0),
        top: Math.max(line - offset, 0),
      }[align || "top"] || offset;

    // Bringing down the topLine to total lines in the editor if exceeding.
    topLine = Math.min(topLine, cm.lineCount());
    this.setFirstVisibleLine(topLine);
  }

  /**
   * Scrolls the view such that the given line number is the first visible line.
   * @memberof utils/source-editor
   */
  setFirstVisibleLine(line) {
    const { top } = this.editor.charCoords({ line, ch: 0 }, "local");
    this.editor.scrollTo(0, top);
  }
}
