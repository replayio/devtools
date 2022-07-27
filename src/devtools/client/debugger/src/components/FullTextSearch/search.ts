import { SearchSourceContentsMatch } from "@replayio/protocol";

import { trackEvent } from "ui/utils/telemetry";
import { ThreadFront } from "protocol/thread";
import groupBy from "lodash/groupBy";
import { getSourceIDsToSearch } from "devtools/client/debugger/src/utils/sourceVisualizations";

import { sliceCodePoints } from "ui/utils/codePointString";
import { SourceDetails } from "ui/reducers/sources";

type $FixTypeLater = any;

const formatSourceMatches = (source: SourceDetails, matches: SearchSourceContentsMatch[]) => ({
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
  updateResults: (cb: (prevResults: $FixTypeLater) => any) => any,
  includeNodeModules: boolean
) {
  trackEvent("project_search.search");

  const sourceIds = getSourceIDsToSearch(sourcesById, includeNodeModules);

  updateResults(() => ({ status: "LOADING", query, matchesBySource: [] }));

  await ThreadFront.searchSources({ query, sourceIds }, matches => {
    updateResults(prevResults => {
      const newMatchesBySource = formatMatchesBySource(matches, sourcesById);
      const matchesBySource = [...prevResults.matchesBySource, ...newMatchesBySource];
      return { matchesBySource };
    });
  });

  updateResults(() => ({ status: "DONE" }));
}
