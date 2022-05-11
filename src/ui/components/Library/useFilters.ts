import { createContext, useMemo, useState } from "react";
import { Recording } from "ui/types";
import { getParams, updateUrlWithParams } from "ui/utils/environment";

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

const substringInString = (substring: string, string: string | null) => {
  if (!string) {
    return false;
  }

  return string.toLowerCase().includes(substring.toLowerCase());
};

export const filterRecordings = (recordings: Recording[], filters: LibraryFilters) => {
  const { searchString, qualifiers } = filters;
  let filteredRecordings = recordings;

  return filteredRecordings.filter(r => {
    const matchesSearchString = searchString
      ? substringInString(searchString, r.url) || substringInString(searchString, r.title)
      : true;
    const matchesTarget = qualifiers.target && qualifiers.target === "target:node" ? !r.user : true;
    const matchesCreated =
      qualifiers.created && new Date(qualifiers.created)
        ? new Date(r.date).getTime() > new Date(qualifiers.created!).getTime()
        : true;

    return matchesSearchString && matchesTarget && matchesCreated;
  });
};

const useFilterString = (str: string) => {
  const [appliedString, setAppliedString] = useState(str);
  const [displayedString, setDisplayedString] = useState(str);

  const setDisplayedText = (newStr: string) => {
    setDisplayedString(newStr);
  };
  const setAppliedText = (newStr: string) => {
    setAppliedString(newStr);
    setDisplayedString(newStr);
    updateUrlWithParams({ q: newStr });
  };

  return {
    appliedString,
    displayedString,
    setDisplayedText,
    setAppliedText,
  };
};

export function useFilters() {
  const initialString = getParams().q || "";
  const { appliedString, displayedString, setDisplayedText, setAppliedText } =
    useFilterString(initialString);
  const filters = useMemo(() => parseFilterString(appliedString), [appliedString]);

  return {
    displayedString,
    setDisplayedText,
    setAppliedText,
    filters,
  };
}
