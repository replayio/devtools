import { CSSProperties } from "react";

import styles from "./AutoCompleteListRow.module.css";

export type ItemData = {
  matches: string[];
  onSubmit: (value: string) => void;
  searchString: string;
  selectedIndex: number;
};

export default function AutoCompleteListRow({
  data,
  index,
  style,
}: {
  data: ItemData;
  index: number;
  style: CSSProperties;
}) {
  const { matches, searchString } = data;

  const match = matches[index];

  const children = [];

  let currentSubString = "";
  let currentSubStringIsMatch = null;
  let searchIndex = 0;

  for (let matchIndex = 0; matchIndex < match.length; matchIndex++) {
    const searchCharacter = searchString[searchIndex];
    const matchCharacter = match[matchIndex];
    const isMatch = searchCharacter === matchCharacter;

    if (isMatch) {
      searchIndex++;
    }

    if (isMatch !== currentSubStringIsMatch) {
      if (currentSubString.length > 0) {
        children.push(
          <span
            key={children.length}
            className={currentSubStringIsMatch ? styles.Match : undefined}
          >
            {currentSubString}
          </span>
        );

        currentSubString = "";
        currentSubStringIsMatch = isMatch;
      }
    }

    currentSubString += matchCharacter;
  }

  if (currentSubString.length > 0) {
    children.push(
      <span key={children.length} className={currentSubStringIsMatch ? styles.Match : undefined}>
        {currentSubString}
      </span>
    );

    currentSubString = "";
  }

  return (
    <div
      className={index === data.selectedIndex ? styles.RowSelected : styles.Row}
      onClick={() => data.onSubmit(match)}
      style={style}
    >
      {children}
    </div>
  );
}
