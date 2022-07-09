/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { getMode } from "../source";

import { isMinified } from "../isMinified";
import { Doc } from "codemirror";
import Editor from "./source-editor";
import { SourceContent } from "ui/reducers/sources";
import { Source } from "../../reducers/sources";
import { SymbolDeclarations } from "../../selectors";

let sourceDocs: Record<string, Doc> = {};

export function getDocument(key: string) {
  return sourceDocs[key];
}

export function hasDocument(key: string) {
  return !!getDocument(key);
}

export function setDocument(key: string, doc: Doc) {
  sourceDocs[key] = doc;
}

export function removeDocument(key: string) {
  delete sourceDocs[key];
}

export function clearDocuments() {
  sourceDocs = {};
}

export function clearEditor(editor: Editor) {
  const doc = editor.createDocument();
  editor.replaceDocument(doc);
  editor.setText("");
  editor.setMode({ name: "text" });
}

export function showLoading(editor: Editor) {
  let doc = getDocument("loading");

  if (doc) {
    editor.replaceDocument(doc);
  } else {
    doc = editor.createDocument();
    setDocument("loading", doc);
    editor.replaceDocument(doc);
    editor.setMode({ name: "text" });
  }
}

export function showErrorMessage(editor: Editor, msg: string) {
  const doc = editor.createDocument();
  editor.replaceDocument(doc);
  editor.setText(msg);
  editor.setMode({ name: "text" });
}

function setEditorText(editor: Editor, sourceId: string, content: SourceContent) {
  console.log({ content });
  const contents = content.value?.value
    .split(/\r\n?|\n|\u2028|\u2029/)
    .map(line => {
      if (line.length >= 1000) {
        return line.substring(0, 1000) + "…";
      }
      return line;
    })
    .join("\n");
  editor.setText(contents);
}

function setMode(
  editor: Editor,
  source: Source,
  content: SourceContent,
  symbols: SymbolDeclarations
) {
  // Disable modes for minified files with 1+ million characters Bug 1569829
  if (isMinified(source) && (content.value?.value.length || 0) > 1000000) {
    return;
  }

  const mode = getMode(source, content.value, symbols);
  const currentMode = editor.codeMirror.getOption("mode");
  if (!currentMode || currentMode.name != mode.name) {
    editor.setMode(mode);
  }
}

/**
 * Handle getting the source document or creating a new
 * document with the correct mode and text.
 */
export function showSourceText(
  editor: Editor,
  source: Source,
  content: SourceContent,
  symbols: SymbolDeclarations
) {
  if (hasDocument(source.id)) {
    const doc = getDocument(source.id);
    if (editor.codeMirror.doc === doc) {
      setMode(editor, source, content, symbols);
      return;
    }

    editor.replaceDocument(doc);
    setMode(editor, source, content, symbols);
    return doc;
  }

  const doc = editor.createDocument();
  setDocument(source.id, doc);
  editor.replaceDocument(doc);

  setEditorText(editor, source.id, content);
  setMode(editor, source, content, symbols);
}
