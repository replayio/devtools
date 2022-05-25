import { createContext, useState } from "react";
import { getParams, updateUrlWithParams } from "ui/utils/environment";

export type LibraryFilter = {
  filter: string;
};

export const LibraryFiltersContext = createContext<LibraryFilter>({
  filter: "",
});

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

  return {
    displayedString,
    setDisplayedText,
    setAppliedText,
    filter: appliedString,
  };
}
