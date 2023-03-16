import { htmlLanguage } from "@codemirror/lang-html";
import {
  javascriptLanguage,
  jsxLanguage,
  tsxLanguage,
  typescriptLanguage,
} from "@codemirror/lang-javascript";
import { jsonLanguage } from "@codemirror/lang-json";
import { LRLanguage, ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { classHighlighter, highlightTree } from "@lezer/highlight";
import { ContentType } from "@replayio/protocol";
import escapeHTML from "escape-html";
import { Cache, createCache } from "suspense";

import classNameToTokenTypes from "replay-next/components/sources/utils/classNameToTokenTypes";

import { StreamingSourceContents } from "./SourcesCache";

export type ParsedToken = {
  columnIndex: number;
  types: string[] | null;
  value: string;
};

export type IncrementalParser = {
  isComplete: () => boolean;
  parseChunk: (
    codeChunk: string,
    isCodeComplete: boolean,
    chunkSize?: number,
    maxParseTime?: number
  ) => void;
  parsedTokensByLine: Array<ParsedToken[]>;
};

export type StreamSubscriber = () => void;
export type UnsubscribeFromStream = () => void;

export type StreamingParser = {
  parsedTokensByLine: Array<ParsedToken[]>;
  parsedTokensPercentage: number;
  rawTextByLine: string[];
  rawTextPercentage: number;
  subscribe(subscriber: StreamSubscriber): UnsubscribeFromStream;
};

export const DEFAULT_MAX_CHARACTERS = 500_000;
export const DEFAULT_MAX_TIME = 5_000;

export const syntaxParsingCache: Cache<
  [code: string, fileName: string],
  Array<ParsedToken[]> | null
> = createCache({
  debugLabel: "SyntaxParsingCache",
  getKey: ([code, fileName]) => `${fileName}:${code}`,
  load: ([code, fileName]) => highlighter(code, fileName),
});

// TODO Replace this with "suspense" streaming cache
export const streamingSyntaxParsingCache: Cache<
  [
    source: StreamingSourceContents,
    fileName: string | null,
    maxCharacters?: number,
    maxTime?: number
  ],
  StreamingParser | null
> = createCache({
  debugLabel: "StreamingSyntaxParsingCache",
  getKey: ([source, fileName, maxCharacters, maxTime]) => `${source.sourceId}:${fileName}`,
  load: async ([source, fileName, maxCharacters, maxTime]) =>
    streamingSourceContentsToStreamingParser(source, fileName, maxCharacters, maxTime),
});

async function streamingSourceContentsToStreamingParser(
  source: StreamingSourceContents,
  fileName: string | null,
  maxCharacters: number = DEFAULT_MAX_CHARACTERS,
  maxTime: number = DEFAULT_MAX_TIME
): Promise<StreamingParser | null> {
  const subscribers: Set<StreamSubscriber> = new Set();

  // TODO [source viewer]
  // Incrementally parse (more than just the first chunk)
  let didParse = false;

  const streamingParser: StreamingParser = {
    parsedTokensByLine: [],
    parsedTokensPercentage: 0,
    rawTextByLine: [],
    rawTextPercentage: 0,
    subscribe(subscriber: StreamSubscriber) {
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
      };
    },
  };

  let sourceIndex = 0;

  const processChunk = () => {
    if (source.contents !== null) {
      if (streamingParser.rawTextByLine.length === 0) {
        streamingParser.rawTextByLine = streamingParser.rawTextByLine.concat(
          source.contents.split("\n")
        );
      } else {
        const lastLine = streamingParser.rawTextByLine[streamingParser.rawTextByLine.length - 1];

        const newLines = source.contents.substring(sourceIndex).split("\n");
        newLines[0] = lastLine + newLines[0];

        streamingParser.rawTextByLine = streamingParser.rawTextByLine
          .slice(0, streamingParser.rawTextByLine.length - 1)
          .concat(newLines);
      }

      sourceIndex = source.contents.length;

      streamingParser.rawTextPercentage = source.contents.length / source.codeUnitCount!;

      // HACK [FE-925]
      // Unprettified sources without source maps can have a lot of text on a single line.
      // Mouse interactions (e.g. hover) sometimes crash the browser with such large text.
      // A rough metric for identifying this type of file is to look at the average number of code units per line.
      const badFormat =
        source.lineCount !== null &&
        source.codeUnitCount !== null &&
        source.codeUnitCount / source.lineCount > 2_500;

      if (!didParse && !badFormat) {
        if (streamingParser.rawTextPercentage === 1 || source.contents.length >= maxCharacters) {
          didParse = true;

          const parser = incrementalParser(fileName, source.contentType!)!;
          parser.parseChunk(source.contents, source.complete, maxCharacters, maxTime);

          // TODO [FE-853]
          // Handle the case where the last line wasn't fully processed.
          // We could do a partial line, but that might be slow for long lines.
          streamingParser.parsedTokensByLine = parser.isComplete()
            ? parser.parsedTokensByLine
            : parser.parsedTokensByLine.slice(0, parser.parsedTokensByLine.length - 1);
          streamingParser.parsedTokensPercentage = streamingParser.rawTextPercentage;
        }
      }

      subscribers.forEach(subscriber => subscriber());
    }
  };

  source.subscribe(processChunk);

  if (source.lineCount !== null) {
    processChunk();
  }

  return streamingParser;
}

function incrementalParser(
  fileName: string | null,
  contentType?: ContentType
): IncrementalParser | null {
  let complete: boolean = false;

  const parsedTokens: Array<ParsedToken[]> = [];

  const currentLineState = {
    parsedTokens: [],
    rawString: "",
  };

  let parsedCharacterIndex = 0;

  function parseChunk(
    code: string,
    isCodeComplete: boolean,
    maxCharacters: number = DEFAULT_MAX_CHARACTERS,
    maxTime: number = DEFAULT_MAX_TIME
  ) {
    let codeToParse = code.slice(parsedCharacterIndex);

    // The logic below to trim code sections only works with "\n"
    codeToParse = codeToParse.replace(/\r\n?|\n|\u2028|\u2029/g, "\n");

    if (codeToParse.length > maxCharacters || !isCodeComplete) {
      let index = maxCharacters - 1;
      while (index > 0 && codeToParse.charAt(index) !== "\n") {
        index--;
      }
      if (index === 0) {
        while (index < codeToParse.length && codeToParse.charAt(index) !== "\n") {
          index++;
        }
      }
      codeToParse = codeToParse.slice(0, index + 1);
    }

    // If possible, use the file extension to infer the language syntax.
    // Extensions like *.tsx or *.jsx end up with a contentType of "text/javascript"
    // but parsing those files with the JavaScript language extension won't be fully accurate.
    let language: LRLanguage | null = null;
    if (fileName) {
      language = urlToLanguage(fileName);
    }
    if (language === null && contentType) {
      language = contentTypeToLanguage(contentType);
    }
    if (language === null) {
      language = javascriptLanguage;
    }

    const state = EditorState.create({
      doc: codeToParse,
      extensions: [language.extension],
    });

    const tree = ensureSyntaxTree(state!, maxCharacters, maxTime);
    if (tree === null) {
      return;
    }

    let characterIndex = 0;

    highlightTree(tree, classHighlighter, (from, to, classes) => {
      if (from > characterIndex) {
        // No style applied to the token between position and from.
        // This typically indicates white space or newline characters.
        processSection(currentLineState, parsedTokens, codeToParse.slice(characterIndex, from), "");
      }

      processSection(currentLineState, parsedTokens, codeToParse.slice(from, to), classes);

      characterIndex = to;
    });

    const maxPosition = codeToParse.length - 1;
    if (characterIndex < maxPosition) {
      // No style applied on the trailing text.
      // This typically indicates white space or newline characters.
      processSection(
        currentLineState,
        parsedTokens,
        codeToParse.slice(characterIndex, maxPosition),
        ""
      );
    }

    if (currentLineState.parsedTokens.length) {
      parsedTokens.push(currentLineState.parsedTokens);
    }

    parsedCharacterIndex += characterIndex + 1;

    complete = isCodeComplete && parsedCharacterIndex >= code.length;

    // Anything that's left should de-opt to plain text.
    if (parsedCharacterIndex < codeToParse.length) {
      let nextIndex = codeToParse.indexOf("\n", parsedCharacterIndex);

      let parsedLineTokens: ParsedToken[] = [];

      while (true) {
        const line =
          nextIndex >= 0
            ? codeToParse.substring(parsedCharacterIndex, nextIndex)
            : codeToParse.substring(parsedCharacterIndex);

        parsedLineTokens.push({
          columnIndex: 0,
          types: null,
          value: line,
        });

        if (nextIndex >= 0) {
          parsedTokens.push(parsedLineTokens);

          parsedLineTokens = [];
        } else if (nextIndex === -1) {
          break;
        }

        parsedCharacterIndex = nextIndex + 1;
        nextIndex = codeToParse.indexOf("\n", parsedCharacterIndex);
      }

      if (parsedLineTokens.length) {
        parsedTokens.push(parsedLineTokens);
      }
    }
  }

  return {
    isComplete: () => complete,
    parsedTokensByLine: parsedTokens,
    parseChunk,
  };
}

function highlighter(code: string, fileName: string): Array<ParsedToken[]> | null {
  const parser = incrementalParser(fileName);
  if (parser === null) {
    return null;
  }

  parser.parseChunk(code, true);

  return parser.parsedTokensByLine;
}

function identity(any: any) {
  return any;
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
      console.error(`Unknown file extension: "${extension}"`);
      return javascriptLanguage;
  }
}

function processSection(
  currentLineState: {
    parsedTokens: ParsedToken[];
    rawString: string;
  },
  parsedTokens: Array<ParsedToken[]>,
  section: string,
  className: string
) {
  const tokenTypes = className ? classNameToTokenTypes(className) : null; // Remove "tok-" prefix;

  let index = 0;
  let nextIndex = section.indexOf("\n");

  while (true) {
    const substring =
      nextIndex >= 0 ? section.substring(index, nextIndex) : section.substring(index);

    const token: ParsedToken = {
      columnIndex: currentLineState.rawString.length,
      types: tokenTypes,
      value: substring,
    };

    currentLineState.parsedTokens.push(token);
    currentLineState.rawString += substring;

    if (nextIndex === -1) {
      break;
    }

    if (nextIndex >= 0) {
      parsedTokens.push(currentLineState.parsedTokens);

      currentLineState.parsedTokens = [];
      currentLineState.rawString = "";
    }

    index = nextIndex + 1;
    nextIndex = section.indexOf("\n", index);
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
