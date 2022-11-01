import { SearchSourceContentsMatch } from "@replayio/protocol";
import groupBy from "lodash/groupBy";

import { getSourceIDsToSearch } from "devtools/client/debugger/src/utils/sourceVisualizations";
import { ReplayClientInterface } from "shared/client/types";
import { SourceDetails } from "ui/reducers/sources";
import { sliceCodePoints } from "ui/utils/codePointString";
import { trackEvent } from "ui/utils/telemetry";

export interface SourceMatchEntry {
  type: "MATCH";
  column: number;
  line: number;
  sourceId: string;
  match: string;
  matchIndex: number;
  value: string;
}

export interface SourceResultEntry {
  type: "RESULT";
  sourceId: string;
  filepath?: string;
  matches: SourceMatchEntry[];
}

const formatSourceMatches = (
  source: SourceDetails,
  matches: SearchSourceContentsMatch[]
): SourceResultEntry => ({
  type: "RESULT",
  sourceId: source.id,
  filepath: source.url,
  matches: matches.map(match => {
    // We have to do this array dance to navigate the string in unicode "code points"
    // because `colunm` is calculated using "code points" as opposed to JS strings
    // which use "code units". It makes a difference in string with fun unicode characters.
    const matchStr = sliceCodePoints(
      match.context,
      match.contextStart.column,
      match.contextEnd.column
    );
    return {
      type: "MATCH",
      column: match.location.column,
      line: match.location.line,
      sourceId: source.id,
      match: matchStr,
      matchIndex: match.context.indexOf(matchStr),
      value: match.context,
    };
  }),
});

const formatMatchesBySource = (
  matches: SearchSourceContentsMatch[],
  sourcesById: Record<string, SourceDetails>
) => {
  const resultsBySource = groupBy(matches, res => res.location.sourceId);
  const filteredResults = Object.entries(resultsBySource)
    .map(([sourceId, matches]) => [sourcesById[sourceId], matches] as const)
    .filter(([source]) => !!source);

  return filteredResults.map(([source, matches]) => formatSourceMatches(source, matches));
};

export async function search(
  query: string,
  sourcesById: Record<string, SourceDetails>,
  onMatches: (newResults: SourceResultEntry[]) => void,
  includeNodeModules: boolean,
  replayClient: ReplayClientInterface
) {
  trackEvent("project_search.search");

  const sourceIds = getSourceIDsToSearch(sourcesById, includeNodeModules);
  await replayClient.searchSources({ query, sourceIds }, matches => {
    // Take raw results from the server and reformat
    const newMatchesBySource = formatMatchesBySource(matches, sourcesById);
    onMatches(newMatchesBySource);
  });
}
