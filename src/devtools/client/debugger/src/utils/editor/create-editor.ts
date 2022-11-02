/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import type { Editor } from "codemirror";

import { assert } from "protocol/utils";

import { features, prefs } from "../prefs";
import type { CodeMirror as CM, SourceEditor as SE } from "./source-editor";

let editorWaiter: Promise<typeof SE>;
let SourceEditor: typeof SE;
let CodeMirror: typeof CM;

export async function waitForEditor() {
  if (!editorWaiter) {
    editorWaiter = import("./source-editor").then(imported => {
      SourceEditor = imported.SourceEditor;
      CodeMirror = imported.CodeMirror;
      return SourceEditor;
    });
  }

  return await editorWaiter;
}

export function getCodeMirror() {
  return CodeMirror;
}

export function createEditor() {
  assert(SourceEditor, "CodeMirror must have been loaded");
  const gutters: (string | { className: string; style?: string })[] = [
    "breakpoints",
    "CodeMirror-linenumbers",
  ];

  // @ts-expect-error why is this pref field not recognized?
  if (features.hitCounts) {
    gutters.push({ className: "hit-markers", style: "width: 22px;" });
  }

  return new SourceEditor({
    mode: "javascript",
    foldGutter: features.codeFolding,
    enableCodeFolding: features.codeFolding,
    readOnly: true,
    lineNumbers: true,
    theme: "mozilla",
    styleActiveLine: false,
    lineWrapping: prefs.editorWrapping,
    matchBrackets: true,
    showAnnotationRuler: true,
    gutters,
    value: " ",
    extraKeys: {
      // Override code mirror keymap to avoid conflicts with split console.
      Esc: false,
      "Cmd-F": false,
      "Ctrl-F": false,
      "Cmd-G": false,
      "Ctrl-G": false,
    },
  });
}

export function createHeadlessEditor() {
  const editor = createEditor();
  editor.appendToLocalElement(document.createElement("div"));
  return editor;
}
