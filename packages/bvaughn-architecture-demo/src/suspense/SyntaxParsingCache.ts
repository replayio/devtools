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

  const htmlLines: string[] = [];

  let position = 0;
  let inProgressHTMLString = "";

  let cachedElement: HTMLElement | null = null;
  // let DEBUG = 0;

  function processSection(section: string, className: string) {
    if (cachedElement === null) {
      cachedElement = document.createElement("span");
    } else {
      cachedElement.innerHTML = "";
    }

    let index = 0;
    let nextIndex = section.indexOf("\n");

    while (true) {
      if (nextIndex === -1) {
        const subsection = section.substring(index);

        cachedElement.className = className;
        cachedElement.textContent = subsection;

        inProgressHTMLString += cachedElement.outerHTML;

        break;
      } else if (nextIndex !== index) {
        const subsection =
          nextIndex >= 0 ? section.substring(index, nextIndex) : section.substring(index);

        cachedElement.className = className;
        cachedElement.textContent = subsection;

        inProgressHTMLString += cachedElement.outerHTML;
      }

      if (nextIndex >= 0) {
        htmlLines.push(inProgressHTMLString);

        inProgressHTMLString = "";
        cachedElement.innerHTML = "";
      }

      index = nextIndex + 1;
      nextIndex = section.indexOf("\n", index);

      // if (++DEBUG > 10_000) {
      //   throw "Too many iterations";
      // }
    }
  }

  highlightTree(tree, classHighlighter, (from, to, classes) => {
    if (from > position) {
      // No style applied to the token between position and from.
      // This typically indicates white space or newline characters.
      processSection(code.slice(position, from), "");
    }

    processSection(code.slice(from, to), classes);

    position = to;
  });

  if (position < tree.length - 1) {
    // No style applied on the trailing text.
    // This typically indicates white space or newline characters.
    processSection(code.slice(position, tree.length), "");
  }

  if (inProgressHTMLString !== "") {
    htmlLines.push(inProgressHTMLString);
  }

  return htmlLines;
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

export const { getValueSuspense: parse } = createGenericCache<
  [code: string, fileName: string],
  string[] | null
>(highlighter, identity);
