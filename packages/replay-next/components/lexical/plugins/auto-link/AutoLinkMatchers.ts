import { LinkMatch } from "./AutoLinkPlugin";

const EMAIL_MATCHER =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const GENERIC_URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const GITHUB_ISSUE_OR_PR_URL_MATCHER =
  /(https?:\/\/)?(www\.)?github\.com\/([^\/]+)\/([^\/]+)\/(issues|pull)\/([0-9]+)([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const GITHUB_CODE_LINK_URL_MATCHER =
  /(https?:\/\/)?(www\.)?github\.com\/([^\/]+)\/([^\/]+)\/blob\/([-a-zA-Z0-9()@:%_+.~?&//=]*)(#L([0-9]+)\-L([0-9]+))?/;

const REPLAY_URL_REGEX =
  /((https?:\/\/(app\.))|(app\.))replay\.io\/recording\/([-a-zA-Z0-9]+)(\?[-a-zA-Z0-9()@:%_+.~#?&//=]*)?/;

export function EmailUrlMatcher(text: string): LinkMatch | null {
  const match = EMAIL_MATCHER.exec(text);
  if (match === null) {
    return null;
  }

  const fullMatch = match[0];
  return {
    formattedText: null,
    index: match.index,
    length: fullMatch.length,
    text: fullMatch,
    url: `mailto:${fullMatch}`,
  };
}

export function GenericUrlMatcher(text: string): LinkMatch | null {
  const match = GENERIC_URL_MATCHER.exec(text);
  if (match === null) {
    return null;
  }

  const fullMatch = match[0];
  return {
    formattedText: null,
    index: match.index,
    length: fullMatch.length,
    text: fullMatch,
    url: fullMatch.startsWith("http") ? fullMatch : `https://${fullMatch}`,
  };
}

export function GitHubCodeLinkUrlMatcher(text: string): LinkMatch | null {
  const match = GITHUB_CODE_LINK_URL_MATCHER.exec(text);
  if (match === null) {
    return null;
  }

  const fullMatch = match[0];

  const organization = match[3]; // e.g. github.com/[replayio]/devtools/blob/path/to/file.ts
  const project = match[4]; // e.g. github.com/replayio/[devtools]/blob/path/to/file.ts
  const filePath = match[5]; // e.g. github.com/replayio/devtools/blob/[path/to/file.ts]
  const fileName = filePath.split("/").pop();

  const lineNumberStart = match[7]; // e.g. github.com/replayio/devtools/blob/path/to/file.ts#L[12]-L34
  const lineNumberEnd = match[8]; // e.g. github.com/replayio/devtools/blob/[path/to/file.ts#L12-L[34]

  let formattedText;
  if (lineNumberStart != null && lineNumberEnd != null) {
    formattedText = `${fileName}:${lineNumberStart}-${lineNumberEnd} (${organization}/${project})`;
  } else {
    formattedText = `${fileName} (${organization}/${project})`;
  }

  return {
    formattedText,
    index: match.index,
    length: fullMatch.length,
    text: fullMatch,
    url: fullMatch.startsWith("http") ? fullMatch : `https://${fullMatch}`,
  };
}

export function GitHubIssueOrPrUrlMatcher(text: string): LinkMatch | null {
  const match = GITHUB_ISSUE_OR_PR_URL_MATCHER.exec(text);
  if (match === null) {
    return null;
  }

  const fullMatch = match[0];

  const organization = match[3]; // e.g. github.com/[replayio]/devtools/issues/123
  const project = match[4]; // e.g. github.com/replayio/[devtools]/issues/123
  const number = match[6]; // e.g. github.com/replayio/devtools/issues/[123]

  const formattedText = `#${number} (${organization}/${project})`;

  return {
    formattedText,
    index: match.index,
    length: fullMatch.length,
    text: fullMatch,
    url: fullMatch.startsWith("http") ? fullMatch : `https://${fullMatch}`,
  };
}

export function ReplayUrlMatcher(text: string): LinkMatch | null {
  const match = REPLAY_URL_REGEX.exec(text);
  if (match === null) {
    return null;
  }

  const fullMatch = match[0];

  const titleAndRecordingId = match[5]; // e.g. github.com/[replayio]/devtools/issues/123
  const pieces = titleAndRecordingId.split("--");
  const title = pieces[0].replace(/-/g, " ");

  const formattedText = `Replay: ${title}`;

  return {
    formattedText,
    index: match.index,
    length: fullMatch.length,
    text: fullMatch,
    url: fullMatch.startsWith("http") ? fullMatch : `https://${fullMatch}`,
  };
}

// Order is significant because it determines priority;
// More specific matchers should come first.
export default [
  ReplayUrlMatcher,
  GitHubCodeLinkUrlMatcher,
  GitHubIssueOrPrUrlMatcher,
  EmailUrlMatcher,
  GenericUrlMatcher,
];
