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
import { classHighlighter, highlightTree } from "@lezer/highlight";

import { createGenericCache } from "./createGenericCache";

// TODO
// Lower the initial threshold to only parse the first ~1k lines
// then continue parsing off thread and stream the HTML in.
async function highlighter(code: string, fileName: string): Promise<string[] | null> {
  const language = urlToLanguage(fileName);
  const state = EditorState.create({
    doc: code,
    extensions: [language.extension],
  });

  // TODO
  // Until we add support for incremental parsing,
  // de-opt to showing plain text for files above a certain threshold.
  const MAX_TOKEN_POSITION = 1_250_000;
  const MAX_PARSE_TIME = 5_000;
  const tree = ensureSyntaxTree(state, MAX_TOKEN_POSITION, MAX_PARSE_TIME);
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

  const maxPosition = code.length - 1;
  if (position < maxPosition) {
    // No style applied on the trailing text.
    // This typically indicates white space or newline characters.
    processSection(code.slice(position, maxPosition), "");
  }

  if (inProgressHTMLString !== "") {
    htmlLines.push(inProgressHTMLString);
  }

  let index = position + 1;

  const div = document.createElement("div");
  div.innerHTML = htmlLines.join("\n");

  // Anything that's left should de-opt to plain text.
  if (index < code.length) {
    let nextIndex = code.indexOf("\n", index);

    while (true) {
      if (nextIndex === -1) {
        const line = code.substring(index);

        inProgressHTMLString += line;

        break;
      } else if (nextIndex !== index) {
        const line = nextIndex >= 0 ? code.substring(index, nextIndex) : code.substring(index);

        inProgressHTMLString += line;
      }

      if (nextIndex >= 0) {
        htmlLines.push(inProgressHTMLString);

        inProgressHTMLString = "";
      }

      index = nextIndex + 1;
      nextIndex = code.indexOf("\n", index);
    }

    if (inProgressHTMLString !== "") {
      htmlLines.push(inProgressHTMLString);
    }
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
