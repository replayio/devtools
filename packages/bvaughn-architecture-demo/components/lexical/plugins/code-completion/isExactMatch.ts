import { Match } from "./types";

export default function isExactMatch(query: string, match: Match): boolean {
  // Remove leading "."
  query = query.slice(1);

  return match === query;
}
