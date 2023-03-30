import { PropsWithChildren } from "react";

import styles from "./ContextMenuCategory.module.css";

export default function ContextMenuCategory({ children }: PropsWithChildren) {
  return <div className={styles.ContextMenuCategory}>{children}</div>;
}
