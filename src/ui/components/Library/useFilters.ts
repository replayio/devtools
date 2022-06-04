import { createContext, useState } from "react";
import { getParams, updateUrlWithParams } from "ui/utils/environment";

type LibraryContextType = {
  filter: string;
  view: View;
  setPreview: (preview: Preview) => void;
  setAppliedText: (str: string) => void;
  preview: Preview | null;
};
type Preview = {
  view: View;
  id: string | string[];
};
export type View = "recordings" | "tests" | "test-runs";

export const LibraryContext = createContext<LibraryContextType>({
  filter: "",
  view: "recordings",
  setPreview: () => {},
  setAppliedText: () => {},
  preview: null,
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
