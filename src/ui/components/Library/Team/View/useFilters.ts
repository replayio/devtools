import { useEffect, useState } from "react";

import { View } from "./ViewContextRoot";

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

const useFilterString = (str: string, view: View) => {
  const [appliedString, setAppliedString] = useState(str);
  const [displayedString, setDisplayedString] = useState(str);

  // Reset the initial string whenever the view changes.
  useEffect(() => {
    setAppliedString(str);
    setDisplayedString(str);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const setDisplayedText = (newStr: string) => {
    setDisplayedString(newStr);
  };
  const setAppliedText = (newStr: string) => {
    setAppliedString(newStr);
    setDisplayedString(newStr);
  };

  return {
    appliedString,
    displayedString,
    setDisplayedText,
    setAppliedText,
  };
};

export function useFilters(view: View) {
  const { appliedString, displayedString, setDisplayedText, setAppliedText } = useFilterString(
    "",
    view
  );

  return {
    displayedString,
    setDisplayedText,
    setAppliedText,
    filter: appliedString,
  };
}
