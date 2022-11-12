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

  let characterIndex = 0;

  return (
    <div
      className={index === data.selectedIndex ? styles.RowSelected : styles.Row}
      onClick={() => data.onSubmit(match)}
      style={style}
    >
      {match.split("").map((char, index) => {
        const searchCharacter = searchString[characterIndex];
        if (char === searchCharacter) {
          characterIndex++;
          return (
            <strong className={styles.Match} key={index}>
              {char}
            </strong>
          );
        } else {
          return <span key={index}>{char}</span>;
        }
      })}
    </div>
  );
}
