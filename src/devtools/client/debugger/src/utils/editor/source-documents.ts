/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { getMode } from "../source";

import { isMinified } from "../isMinified";

let sourceDocs = {};

export function getDocument(key) {
  return sourceDocs[key];
}

export function hasDocument(key) {
  return !!getDocument(key);
}

export function setDocument(key, doc) {
  sourceDocs[key] = doc;
}

export function removeDocument(key) {
  delete sourceDocs[key];
}

export function clearDocuments() {
  sourceDocs = {};
}

export function updateDocument(editor, source) {
  if (!source) {
    return;
  }

  const sourceId = source.id;
  const doc = getDocument(sourceId) || editor.createDocument();
  editor.replaceDocument(doc);
}

export function clearEditor(editor) {
  const doc = editor.createDocument();
  editor.replaceDocument(doc);
  editor.setText("");
  editor.setMode({ name: "text" });
}

export function showLoading(editor) {
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

export function showErrorMessage(editor, msg) {
  let error;
  error = L10N.getFormatStr("errorLoadingText3", msg);
  const doc = editor.createDocument();
  editor.replaceDocument(doc);
  editor.setText(error);
  editor.setMode({ name: "text" });
}

function setEditorText(editor, sourceId, content) {
  const contents = content.value
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

function setMode(editor, source, content, symbols) {
  // Disable modes for minified files with 1+ million characters Bug 1569829
  if (content.type === "text" && isMinified(source) && content.value.length > 1000000) {
    return;
  }

  const mode = getMode(source, content, symbols);
  const currentMode = editor.codeMirror.getOption("mode");
  if (!currentMode || currentMode.name != mode.name) {
    editor.setMode(mode);
  }
}

/**
 * Handle getting the source document or creating a new
 * document with the correct mode and text.
 */
export function showSourceText(editor, source, content, symbols) {
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
