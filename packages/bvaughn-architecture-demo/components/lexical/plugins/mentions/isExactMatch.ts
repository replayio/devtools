import { Collaborator } from "./types";

export default function isExactMatch(query: string, collaborator: Collaborator): boolean {
  // Strip the "@" prefix off of the query before searching.
  query = query.slice(1);

  return collaborator.name === query;
}
