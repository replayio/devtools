import { javascriptLanguage } from "@codemirror/lang-javascript";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { Tree } from "@lezer/common";
import { highlightTree, classHighlighter } from "@lezer/highlight";

import { createGenericCache } from "./createGenericCache";

function codeToState(code: string): EditorState {
  return EditorState.create({
    doc: code,
    extensions: [javascriptLanguage.extension],
  });
}

function stateToTree(state: EditorState): Tree | null {
  return ensureSyntaxTree(state, state.doc.length, 1e9);
}

function identity(any: any) {
  return any;
}

// TODO
// Suspense can be async; we could move this to a Worker if it's slow.
async function highlighter(code: string): Promise<string[] | null> {
  const state = codeToState(code);
  const tree = stateToTree(state);
  if (tree === null) {
    return null;
  }

  const container = document.createElement("div");

  let position = 0;

  highlightTree(tree, classHighlighter, (from, to, classes) => {
    if (from > position) {
      // No style applied to the token between position and from
      container.appendChild(document.createTextNode(code.slice(position, from)));
    }

    const span = container.appendChild(document.createElement("span"));
    span.className = classes;
    span.appendChild(document.createTextNode(code.slice(from, to)));

    position = to;
  });

  if (position < tree.length - 1) {
    // No style applied on the trailing text
    container.appendChild(document.createTextNode(code.slice(position, tree.length)));
  }

  return container.innerHTML.split("\n");
}

export const { getValueSuspense: highlight } = createGenericCache<[code: string], string[] | null>(
  highlighter,
  identity
);
