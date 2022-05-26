import { createContext, useMemo, useState } from "react";
import { Recording } from "ui/types";
import { getParams, updateUrlWithParams } from "ui/utils/environment";

type QualifierKey = "created" | "target";
type Qualifier = { key: QualifierKey; isValid: (str: string) => boolean; errorMessage: string };
export type ParsedQualifier = { value: string; error?: string };
export type ParsedQualifiers = Partial<Record<QualifierKey, ParsedQualifier>>;
const QUALIFIERS: Qualifier[] = [
  {
    key: "created",
    isValid: (str: string) => !!str.match(/created:\d\d\d\d-\d\d-\d\d/),
    errorMessage: "Created date should be in the format YYYY-MM-DD",
  },
  {
    key: "target",
    isValid: (str: string) => !!str.match(/target:node/),
    errorMessage: "Replay currently only supports filtering by target:node",
  },
];

export type LibraryFilters = {
  searchString: string;
  qualifiers: ParsedQualifiers;
};

export const LibraryFiltersContext = createContext<LibraryFilters>({
  searchString: "",
  qualifiers: {},
});

function getQualifierValue(key: string, string: string) {
  const tokens = string.split(" ");
  const expression = new RegExp(`^${key}:`);

  // If there are multiple matching entries for the same filter, use the last one.
  return tokens.filter(w => !!w.match(expression)).pop() || null;
}

function getQualifiers(str: string) {
  const qualifiers: ParsedQualifiers = {};

  QUALIFIERS.forEach(qualifier => {
    const value = getQualifierValue(qualifier.key, str);

    if (value) {
      qualifiers[qualifier.key] = {
        value,
        error: !qualifier.isValid(value) ? qualifier.errorMessage : undefined,
      };
    }
  });

  return qualifiers;
}

function getSearchString(str: string) {
  const words = str.split(" ");
  const expression = new RegExp(`^${QUALIFIERS.map(qualifier => qualifier.key).join(":|^")}:`);
  return words.filter(w => !w.match(new RegExp(expression))).join(" ");
}

function parseFilterString(str: string): LibraryFilters {
  return { qualifiers: getQualifiers(str), searchString: getSearchString(str) };
}

const substringInString = (substring: string, string: string | null) => {
  return string ? string.toLowerCase().includes(substring.toLowerCase()) : false;
};

export const filterRecordings = (recordings: Recording[], filters: LibraryFilters) => {
  const { searchString, qualifiers } = filters;
  let filteredRecordings = recordings;

  return filteredRecordings.filter(r => {
    const matchesSearchString = searchString
      ? substringInString(searchString, r.url) || substringInString(searchString, r.title)
      : true;
    const matchesTarget =
      qualifiers.target && qualifiers.target.value === "target:node" && !qualifiers.target.error
        ? !r.user
        : true;
    const matchesCreated =
      qualifiers.created && new Date(qualifiers.created.value) && !qualifiers.created.error
        ? new Date(r.date).getTime() > new Date(qualifiers.created.value).getTime()
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
