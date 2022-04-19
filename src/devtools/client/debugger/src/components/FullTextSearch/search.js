import { getSourceIDsToSearch } from "devtools/client/debugger/src/utils/source";
import groupBy from "lodash/groupBy";
import { ThreadFront } from "protocol/thread";
import { sliceCodePoints } from "ui/utils/codePointString";
import { trackEvent } from "ui/utils/telemetry";

const formatSourceMatches = (source, matches) => ({
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
      column: match.location.column,
      line: match.location.line,
      match: matchStr,
      matchIndex: match.context.indexOf(matchStr),
      sourceId: source.id,
      type: "MATCH",
      value: match.context,
    };
  }),
  sourceId: source.id,
  type: "RESULT",
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

  updateResults(() => ({ matchesBySource: [], query, status: "LOADING" }));

  await ThreadFront.searchSources({ query, sourceIds }, matches => {
    updateResults(prevResults => {
      const newMatchesBySource = formatMatchesBySource(matches, sourcesById);
      const matchesBySource = [...prevResults.matchesBySource, ...newMatchesBySource];
      return { matchesBySource };
    });
  });

  updateResults(() => ({ status: "DONE" }));
}
