import { ReactNode, useState } from "react";

import Icon from "../Icon";

import styles from "./Collapsible.module.css";

export type RenderChildrenFunction = () => ReactNode;

export default function Collapsible({
  children,
  defaultOpen = false,
  header,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  header: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.Collapsible}>
      <div className={styles.PreviewRow} onClick={() => setIsOpen(!isOpen)}>
        <div className={isOpen ? styles.ArrowExpanded : styles.ArrowCollapsed}>
          <Icon className={styles.ArrowIcon} type="arrow" />
        </div>
        {header}
      </div>

      {isOpen ? <div className={styles.Children}>{children}</div> : null}
    </div>
  );
}
