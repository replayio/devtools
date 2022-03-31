import { trackEvent } from "ui/utils/telemetry";
import { ThreadFront } from "protocol/thread";
import groupBy from "lodash/groupBy";
import { getSourceIDsToSearch } from "devtools/client/debugger/src/utils/source";

import { sliceCodePoints } from "ui/utils/codePointString";

const formatSourceMatches = (source, matches) => ({
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

const formatMatchesBySource = (matches, sourcesById) => {
  const resultsBySource = groupBy(matches, res => res.location.sourceId);
  const filteredResults = Object.entries(resultsBySource)
    .map(([sourceId, matches]) => [sourcesById[sourceId], matches])
    .filter(([source]) => !!source);

  return filteredResults.map(([source, matches]) => formatSourceMatches(source, matches));
};

export async function search(query, sourcesById, updateResults, includeNodeModules) {
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
