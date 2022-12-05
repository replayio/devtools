import { Collaborator } from "./types";

export default function findMatches(
  collaborators: Collaborator[],
  query: string,
  _: string | null
): Collaborator[] {
  // Strip the "@" prefix off of the query before searching.
  query = query.slice(1);

  if (query === "") {
    // If there's nothing left in the query, just show everything.
    return collaborators;
  }

  const caseInsensitiveQuery = query.toLowerCase();

  return collaborators.filter(collaborator =>
    collaborator.name.toLowerCase().includes(caseInsensitiveQuery)
  );
}
