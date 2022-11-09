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

import { createGenericCache } from "./createGenericCache";
import { StreamingSourceContents } from "./SourcesCache";

export type IncrementalParser = {
  isComplete: () => boolean;
  parseChunk: (
    codeChunk: string,
    isCodeComplete: boolean,
    chunkSize?: number,
    maxParseTime?: number
  ) => void;
  parsedLines: string[];
};

export type StreamSubscriber = () => void;
export type UnsubscribeFromStream = () => void;

export type StreamingParser = {
  parsedLines: string[];
  parsedProgress: number;
  rawLines: string[];
  rawProgress: number;
  subscribe(subscriber: StreamSubscriber): UnsubscribeFromStream;
};

export const DEFAULT_MAX_CHARACTERS = 500_000;
export const DEFAULT_MAX_TIME = 5_000;

export const { getValueSuspense: parse } = createGenericCache<
  [code: string, fileName: string],
  string[] | null
>(highlighter, identity);

export const { getValueSuspense: parseStreaming, getValueAsync: parseStreamingAsync } =
  createGenericCache<[source: StreamingSourceContents, maxTime?: number], StreamingParser | null>(
    streamingSourceContentsToStreamingParser,
    identity
  );

let cachedElement: HTMLElement | null = null;

async function streamingSourceContentsToStreamingParser(
  source: StreamingSourceContents,
  maxCharacters: number = DEFAULT_MAX_CHARACTERS,
  maxTime: number = DEFAULT_MAX_TIME
): Promise<StreamingParser | null> {
  const subscribers: Set<StreamSubscriber> = new Set();

  // TODO [source viewer]
  // Incrementally parse (more than just the first chunk)
  let didParse = false;

  const streamingParser: StreamingParser = {
    parsedLines: [],
    parsedProgress: 0,
    rawLines: [],
    rawProgress: 0,
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
      if (streamingParser.rawLines.length === 0) {
        streamingParser.rawLines = streamingParser.rawLines.concat(source.contents.split("\n"));
      } else {
        const lastLine = streamingParser.rawLines[streamingParser.rawLines.length - 1];

        const newLines = source.contents.substring(sourceIndex).split("\n");
        newLines[0] = lastLine + newLines[0];

        streamingParser.rawLines = streamingParser.rawLines
          .slice(0, streamingParser.rawLines.length - 1)
          .concat(newLines);
      }

      sourceIndex = source.contents.length;

      streamingParser.rawProgress = source.contents.length / source.codeUnitCount!;

      // HACK [FE-925]
      // Unprettified sources without source maps can have a lot of text on a single line.
      // Mouse interactions (e.g. hover) sometimes crash the browser with such large text.
      // A rough metric for identifying this type of file is to look at the average number of code units per line.
      const badFormat =
        source.lineCount !== null &&
        source.codeUnitCount !== null &&
        source.codeUnitCount / source.lineCount > 2_500;

      if (!didParse && !badFormat) {
        if (streamingParser.rawProgress === 1 || source.contents.length >= maxCharacters) {
          didParse = true;

          const parser = incrementalParser(undefined, source.contentType!)!;
          parser.parseChunk(source.contents, source.complete, maxCharacters, maxTime);

          // TODO [FE-853]
          // Handle the case where the last line wasn't fully processed.
          // We could do a partial line, but that might be slow for long lines.
          streamingParser.parsedLines = parser.isComplete()
            ? parser.parsedLines
            : parser.parsedLines.slice(0, parser.parsedLines.length - 1);
          streamingParser.parsedProgress = streamingParser.rawProgress;
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

function incrementalParser(fileName?: string, contentType?: ContentType): IncrementalParser | null {
  let complete: boolean = false;
  const parsedLines: string[] = [];

  let inProgressHTMLString = "";
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

    let language = javascriptLanguage;
    if (contentType) {
      language = contentTypeToLanguage(contentType);
    } else if (fileName) {
      language = urlToLanguage(fileName);
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
        inProgressHTMLString = processSection(
          inProgressHTMLString,
          parsedLines,
          codeToParse.slice(characterIndex, from),
          ""
        );
      }

      inProgressHTMLString = processSection(
        inProgressHTMLString,
        parsedLines,
        codeToParse.slice(from, to),
        classes
      );

      characterIndex = to;
    });

    const maxPosition = codeToParse.length - 1;
    if (characterIndex < maxPosition) {
      // No style applied on the trailing text.
      // This typically indicates white space or newline characters.
      inProgressHTMLString = processSection(
        inProgressHTMLString,
        parsedLines,
        codeToParse.slice(characterIndex, maxPosition),
        ""
      );
    }

    if (inProgressHTMLString !== "") {
      parsedLines.push(inProgressHTMLString);
    }

    parsedCharacterIndex += characterIndex + 1;

    complete = isCodeComplete && parsedCharacterIndex >= code.length;

    // Anything that's left should de-opt to plain text.
    if (parsedCharacterIndex < codeToParse.length) {
      let nextIndex = codeToParse.indexOf("\n", parsedCharacterIndex);

      while (true) {
        if (nextIndex === -1) {
          const line = codeToParse.substring(parsedCharacterIndex);

          inProgressHTMLString += line;

          break;
        } else if (nextIndex !== parsedCharacterIndex) {
          const line =
            nextIndex >= 0
              ? codeToParse.substring(parsedCharacterIndex, nextIndex)
              : codeToParse.substring(parsedCharacterIndex);

          inProgressHTMLString += line;
        }

        if (nextIndex >= 0) {
          parsedLines.push(inProgressHTMLString);

          inProgressHTMLString = "";
        }

        parsedCharacterIndex = nextIndex + 1;
        nextIndex = codeToParse.indexOf("\n", parsedCharacterIndex);
      }

      if (inProgressHTMLString !== "") {
        parsedLines.push(inProgressHTMLString);
      }
    }

    inProgressHTMLString = "";
  }

  return {
    isComplete: () => complete,
    parsedLines,
    parseChunk,
  };
}

function highlighter(code: string, fileName: string): string[] | null {
  const parser = incrementalParser(fileName);
  if (parser === null) {
    return null;
  }

  parser.parseChunk(code, true);

  return parser.parsedLines;
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
  inProgressHTMLString: string,
  parsedLines: string[],
  section: string,
  className: string
): string {
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
      parsedLines.push(inProgressHTMLString);

      inProgressHTMLString = "";
      cachedElement.innerHTML = "";
    }

    index = nextIndex + 1;
    nextIndex = section.indexOf("\n", index);
  }

  return inProgressHTMLString;
}
