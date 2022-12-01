export default function findMatches(
  collaboratorNames: string[],
  query: string,
  _: string | null
): string[] {
  // Strip the "@" prefix off of the query before searching.
  query = query.slice(1);

  if (query === "") {
    // If there's nothing left in the query, just show everything.
    return collaboratorNames;
  }

  const caseInsensitiveQuery = query.toLowerCase();

  return collaboratorNames.filter(name => name.toLowerCase().includes(caseInsensitiveQuery));
}
