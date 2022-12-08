const REGEX = /[\B]?https:\/\/(www\.)?github\.com\/([^\/]+)\/([^\/]+)\/(issues|pull)\/([0-9]+)/;

export function getMatch(text: string): { end: number; start: number } | null {
  const match = REGEX.exec(text);
  if (match === null) {
    return null;
  }

  return {
    end: match.index + match[0].length,
    start: match.index,
  };
}

export function getFormattedText(text: string): string | null {
  const match = REGEX.exec(text);
  if (match === null) {
    return null;
  }

  const organization = match[2]; // e.g. github.com/[replayio]/devtools
  const project = match[3]; // e.g. github.com/replayio/[devtools]
  // const type = match[4] === "pull" ? "PR" : "Issue"; // "pull" or "issues"
  const number = match[5];

  return `#${number} (${organization}/${project})`;
}
