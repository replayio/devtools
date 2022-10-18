import {
  javascriptLanguage,
  jsxLanguage,
  tsxLanguage,
  typescriptLanguage,
} from "@codemirror/lang-javascript";
import { jsonLanguage } from "@codemirror/lang-json";
import { htmlLanguage } from "@codemirror/lang-html";
import { LRLanguage, ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { classHighlighter, highlightTree, tags } from "@lezer/highlight";

import { createGenericCache } from "./createGenericCache";

// TODO
// Suspense can be async; we could move this to a Worker if it's slow.
async function highlighter(code: string, fileName: string): Promise<string[] | null> {
  const language = urlToLanguage(fileName);
  const state = EditorState.create({
    doc: code,
    extensions: [language.extension],
  });
  const tree = ensureSyntaxTree(state, state.doc.length, 1e9);
  if (tree === null) {
    return null;
  }

  const container = document.createElement("div");

  let position = 0;

  // TODO
  // Rather than creating a giant HTML string that we then split into lines–
  // we could be creating the lines array as we go.
  highlightTree(tree, classHighlighter, (from, to, classes) => {
    if (from > position) {
      // No style applied to the token between position and from
      container.appendChild(document.createTextNode(code.slice(position, from)));
    }

    const slice = code.slice(from, to);
    const lines = slice.split("\n");

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];

      const span = container.appendChild(document.createElement("span"));
      span.className = classes;
      span.appendChild(document.createTextNode(line));

      if (index < lines.length - 1) {
        container.appendChild(document.createTextNode("\n"));
      }
    }

    position = to;
  });

  if (position < tree.length - 1) {
    // No style applied on the trailing text
    container.appendChild(document.createTextNode(code.slice(position, tree.length)));
  }

  return container.innerHTML.split("\n");
}

function identity(any: any) {
  return any;
}

function urlToLanguage(fileName: string): LRLanguage {
  const extension = fileName.split(".").pop();
  switch (extension) {
    case "js":
      return javascriptLanguage;
    case "jsx":
      return jsxLanguage;
    case "ts":
      return typescriptLanguage;
    case "tsx":
      return tsxLanguage;
    case "json":
      return jsonLanguage;
    case "html":
      return htmlLanguage;
    default:
      console.error(`Unknown file extension: ${extension}`);
      return javascriptLanguage;
  }
}

export const { getValueSuspense: highlight } = createGenericCache<
  [code: string, fileName: string],
  string[] | null
>(highlighter, identity);
