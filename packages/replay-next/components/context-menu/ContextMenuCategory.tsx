import { MouseEvent, PropsWithChildren } from "react";

import styles from "./ContextMenuCategory.module.css";

export default function ContextMenuCategory({ children }: PropsWithChildren) {
  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className={styles.ContextMenuCategory} onClick={onClick}>
      {children}
    </div>
  );
}
