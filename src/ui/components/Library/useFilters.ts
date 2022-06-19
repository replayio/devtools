import { createContext, useState } from "react";
import { getParams, updateUrlWithParams } from "ui/utils/environment";

type LibraryContextType = {
  filter: string;
  view: View;
  setPreview: (preview: Preview) => void;
  setView: (view: View) => void;
  setAppliedText: (str: string) => void;
  preview: Preview | null;
};
export type Preview = {
  view: "test-runs";
  id: string;
  recordingId?: string | null;
};
export type View = "recordings" | "test-runs" | "test-results";

export const LibraryContext = createContext<LibraryContextType>({
  filter: "",
  view: "recordings",
  setPreview: () => {},
  setView: () => {},
  setAppliedText: () => {},
  preview: null,
});

type Surrounder = {
  [open: string]: string;
};

const SURROUNDERS: Surrounder = {
  "'": "'",
  '"': '"',
  "[": "]",
};

const peekUntil = (input: string, until: string): string | void => {
  return input.match(new RegExp(`^(.*?${until})`))?.[0];
};

const peekNextWord = (input: string): string => {
  return input.match(new RegExp(`^(\S+)`))?.[0] ?? "";
};

export function encodeFilter(str: string) {
  let encodedStr = "";
  while (str.length > 0) {
    const [match] = str.match(/^(.*?:)/) || [];
    if (match) {
      encodedStr += match;
      str = str.substring(match.length);

      const nextChar = str.substring(0, 1);
      if (Object.keys(SURROUNDERS).includes(nextChar)) {
        const closingChar = SURROUNDERS[nextChar];
        const valueMatch = peekUntil(str.substring(1), closingChar);

        if (valueMatch) {
          encodedStr += encodeURIComponent(`${nextChar}${valueMatch}`);
          str = str.substring(valueMatch.length + 1);
        } else {
          encodedStr += str.substring(1);
          str = "";
        }
      } else {
        const nextWord = peekNextWord(str);
        // const [nextWord] = str.match(/^(\w+)/) || [];
        console.log(`nw`, str, nextWord);
        encodedStr += nextWord;
        str = str.substring(nextWord.length);
      }
    } else {
      encodedStr += str;
      str = "";
    }
  }

  return encodedStr;
}

const useFilterString = (str: string) => {
  const [appliedString, setAppliedString] = useState(str);
  const [displayedString, setDisplayedString] = useState(str);

  const setDisplayedText = (newStr: string) => {
    setDisplayedString(newStr);
  };
  const setAppliedText = (newStr: string) => {
    setAppliedString(newStr);
    setDisplayedString(newStr);
    updateUrlWithParams({ q: encodeFilter(newStr) });
  };

  return {
    appliedString,
    displayedString,
    setDisplayedText,
    setAppliedText,
  };
};

export function useFilters() {
  const initialString = decodeURIComponent(getParams().q || "");
  const { appliedString, displayedString, setDisplayedText, setAppliedText } =
    useFilterString(initialString);

  return {
    displayedString,
    setDisplayedText,
    setAppliedText,
    filter: appliedString,
  };
}
