import { htmlLanguage } from "@codemirror/lang-html";
import {
  javascriptLanguage,
  jsxLanguage,
  tsxLanguage,
  typescriptLanguage,
} from "@codemirror/lang-javascript";
import { jsonLanguage } from "@codemirror/lang-json";
import { LRLanguage, ensureSyntaxTree } from "@codemirror/language";
import { EditorState, Text } from "@codemirror/state";
import { classHighlighter, highlightTree } from "@lezer/highlight";
import { ContentType } from "@replayio/protocol";
import escapeHTML from "escape-html";

import classNameToTokenTypes from "replay-next/components/sources/utils/classNameToTokenTypes";

const MAX_TIME = 5_000;

export type ParsedToken = {
  columnIndex: number;
  types: string[] | null;
  value: string;
};

export type IncrementalParser = ReturnType<typeof createIncrementalParser>;

export function createIncrementalParser(fileName: string | null, contentType?: ContentType | null) {
  const language = inferLanguage(fileName, contentType);
  let state = EditorState.create({
    doc: "",
    extensions: [language.extension],
  });
  let parsedLines = 0;

  return function parseChunk(chunk: string, isLastChunk: boolean) {
    const previousLength = state.doc.length;
    state = state.update({
      changes: {
        from: previousLength,
        to: previousLength,
        insert: chunk,
      },
    }).state;

    const tree = ensureSyntaxTree(state, state.doc.length, MAX_TIME);
    if (!tree) {
      return [];
    }

    let currentIndex = state.doc.line(parsedLines + 1).from;
    const parsedTokens: ParsedToken[][] = [];
    highlightTree(
      tree,
      classHighlighter,
      (from, to, classes) => {
        if (from > currentIndex) {
          addSection(state.doc, parsedTokens, parsedLines, currentIndex, from);
        }
        addSection(state.doc, parsedTokens, parsedLines, from, to, classes);
        currentIndex = to;
      },
      currentIndex
    );
    if (currentIndex < state.doc.length) {
      addSection(state.doc, parsedTokens, parsedLines, currentIndex, state.doc.length);
    }

    if (!isLastChunk) {
      parsedTokens.pop();
    }

    parsedLines += parsedTokens.length;

    return parsedTokens;
  };
}

function addSection(
  doc: Text,
  parsedTokens: ParsedToken[][],
  lineOffset: number,
  from: number,
  to: number,
  classes?: string
) {
  const types = classes ? classNameToTokenTypes(classes) : null; // Remove "tok-" prefix;
  const fromLine = doc.lineAt(from);
  const toLine = doc.lineAt(to);

  for (let lineNumber = fromLine.number; lineNumber <= toLine.number; lineNumber++) {
    const line = doc.line(lineNumber);
    const columnIndex = Math.max(from - line.from, 0);
    const value = line.text.slice(columnIndex, to - line.from);

    if (!parsedTokens[lineNumber - lineOffset - 1]) {
      parsedTokens[lineNumber - lineOffset - 1] = [];
    }
    if (value.length > 0) {
      parsedTokens[lineNumber - lineOffset - 1].push({
        types,
        columnIndex,
        value,
      });
    }
  }
}

function inferLanguage(fileName: string | null, contentType?: ContentType | null) {
  // If possible, use the file extension to infer the language syntax.
  // Extensions like *.tsx or *.jsx end up with a contentType of "text/javascript"
  // but parsing those files with the JavaScript language extension won't be fully accurate.
  if (fileName) {
    return urlToLanguage(fileName);
  }
  if (contentType) {
    return contentTypeToLanguage(contentType);
  }
  return javascriptLanguage;
}

function contentTypeToLanguage(contentType: ContentType): LRLanguage {
  switch (contentType) {
    case "text/html":
      return htmlLanguage;
    case "text/javascript":
      return javascriptLanguage;
    default:
      console.error(`Unknown content-type: "${contentType}"`);
      return javascriptLanguage;
  }
}

function urlToLanguage(fileName: string): LRLanguage {
  const extension = fileName.split(".").pop()!.split("?").shift()!;
  switch (extension) {
    case "js":
    case "mjs":
    case "cjs":
      return javascriptLanguage;
    case "jsx":
      return jsxLanguage;
    case "ts":
      return typescriptLanguage;
    case "tsx":
    // .mts and .cts follow .tsx parsing rules (they don't support angle bracket casting and they allow JSX)
    case "mts":
    case "cts":
      return tsxLanguage;
    case "json":
      return jsonLanguage;
    case "html":
      return htmlLanguage;
    default:
      console.error(`Unknown file extension: "${extension}"`);
      return javascriptLanguage;
  }
}

export function parsedTokensToHtml(tokens: ParsedToken[]): string {
  return tokens
    .map(token => {
      let className = undefined;
      if (token.types) {
        className = token.types.map(type => `tok-${type}`).join(" ");
      }

      const escapedValue = escapeHTML(token.value);

      return `<span class="${className}">${escapedValue}</span>`;
    })
    .join("");
}
