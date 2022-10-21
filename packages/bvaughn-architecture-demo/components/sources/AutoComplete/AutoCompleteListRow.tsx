import { CSSProperties } from "react";

import styles from "./AutoCompleteListRow.module.css";

export type ItemData = {
  matches: string[];
  onSubmit: (value: string) => void;
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
  const match = data.matches[index];

  return (
    <div
      className={index === data.selectedIndex ? styles.RowSelected : styles.Row}
      onClick={() => data.onSubmit(match)}
      style={style}
    >
      {match}
    </div>
  );
}
