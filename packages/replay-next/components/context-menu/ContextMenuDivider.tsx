import { MouseEvent } from "react";

import styles from "./ContextMenuDivider.module.css";

export default function ContextMenuDivider() {
  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return <div className={styles.Divider} onClick={onClick} />;
}
