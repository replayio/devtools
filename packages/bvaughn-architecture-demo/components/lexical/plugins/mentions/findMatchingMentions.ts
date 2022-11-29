import { SearchPromise } from "../typeahead/types";
import data from "./data";
import { TeamMember } from "./types";

export default function findMatchingMentions(
  query: string,
  _: string | null
): SearchPromise<TeamMember> {
  // Strip the "@" prefix off of the query before searching.
  query = query.slice(1);

  const cancel = () => {
    // No-op since this implementation is synchronous
  };

  if (query === "") {
    // If there's nothing left in the query, just show everything.
    return {
      cancel,
      promise: Promise.resolve(data),
    };
  }

  const caseInsensitiveQuery = query.toLowerCase();

  const matches = data.filter(
    ({ name, username }) =>
      name.toLowerCase().includes(caseInsensitiveQuery) ||
      username.toLowerCase().includes(caseInsensitiveQuery)
  );

  return {
    cancel,
    promise: Promise.resolve(matches),
  };
}
