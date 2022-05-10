import { createContext, useState } from "react";
import { Recording } from "ui/types";

export type LibraryFilters = {
  searchString: string;
  qualifiers: {
    created?: string;
    target?: string;
  };
};

export const LibraryFiltersContext = createContext({
  searchString: "",
  qualifiers: {},
});

function parseFilterString(str: string): LibraryFilters {
  const words = str.split(" ");

  // If there are multiple matching entries for the same filter, use the last one.
  // TODO: Add validation for created and target. It should return null if the user didn't comply with
  // the expected format.
  const created = words.filter(w => !!w.match(/^created:/)).pop();
  const target = words.filter(w => !!w.match(/^target:/)).pop();
  const searchString = words.filter(w => !w.match(/created:|target:/)).join(" ");

  return { qualifiers: { created, target }, searchString };
}

export function useFilters() {
  const [displayedSearchString, setFilterString] = useState("");
  const filters = parseFilterString(displayedSearchString);

  return { displayedSearchString, filters, setFilterString };
}

const subStringInString = (subString: string, string: string | null) => {
  if (!string) {
    return false;
  }

  return string.toLowerCase().includes(subString.toLowerCase());
};

export const filterRecordings = (recordings: Recording[], filters: LibraryFilters) => {
  const { searchString, qualifiers } = filters;
  let filteredRecordings = recordings;

  filteredRecordings = searchString
    ? recordings.filter(
        r => subStringInString(searchString, r.url) || subStringInString(searchString, r.title)
      )
    : recordings;
  filteredRecordings =
    qualifiers.target && qualifiers.target === "target:node"
      ? filteredRecordings.filter(r => !r.user)
      : filteredRecordings;
  filteredRecordings =
    qualifiers.created && new Date(qualifiers.created)
      ? filteredRecordings.filter(
          r => new Date(r.date).getTime() > new Date(qualifiers.created!).getTime()
        )
      : filteredRecordings;

  return filteredRecordings;
};
