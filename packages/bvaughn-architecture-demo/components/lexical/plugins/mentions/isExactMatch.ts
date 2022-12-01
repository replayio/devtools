export default function isExactMatch(query: string, collaboratorName: string): boolean {
  // Strip the "@" prefix off of the query before searching.
  query = query.slice(1);

  return collaboratorName === query;
}
