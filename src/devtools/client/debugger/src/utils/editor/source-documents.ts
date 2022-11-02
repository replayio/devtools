/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { Doc } from "codemirror";

import type { SourceContent, SourceContentValue, SourceDetails } from "ui/reducers/sources";

import { SymbolDeclarations } from "../../selectors";
import { isMinified } from "../isMinified";
import { getMode } from "../source";
import type { SourceEditor } from "./source-editor";

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

export function updateDocument(editor: SourceEditor, source?: SourceContent) {
  if (!source) {
    return;
  }

  const sourceId = source.id;
  const doc = getDocument(sourceId) || editor.createDocument();
  editor.replaceDocument(doc);
}

export function clearEditor(editor: SourceEditor) {
  const doc = editor.createDocument();
  editor.replaceDocument(doc);
  editor.setText("");
  editor.setMode({ name: "text" });
}

export function showLoading(editor: SourceEditor) {
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

export function showErrorMessage(editor: SourceEditor, msg: string) {
  let error = `Error loading this URI: ${msg}`;
  const doc = editor.createDocument();
  editor.replaceDocument(doc);
  editor.setText(error);
  editor.setMode({ name: "text" });
}

function setEditorText(editor: SourceEditor, sourceId: string, content: SourceContentValue) {
  const contents = content!.value
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
  editor: SourceEditor,
  source: SourceDetails,
  content: SourceContentValue,
  symbols: SymbolDeclarations
) {
  // Disable modes for minified files with 1+ million characters Bug 1569829
  if (content!.type === "text" && isMinified(source) && content!.value.length > 1000000) {
    return;
  }

  const mode = getMode(source, content, symbols);
  const currentMode = editor.codeMirror.getOption("mode");
  // @ts-expect-error currentMode.name doesn't exist
  if (!currentMode || currentMode.name != mode.name) {
    editor.setMode(mode);
  }
}

/**
 * Handle getting the source document or creating a new
 * document with the correct mode and text.
 */
export function showSourceText(
  editor: SourceEditor,
  source: SourceDetails,
  content: SourceContentValue,
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
