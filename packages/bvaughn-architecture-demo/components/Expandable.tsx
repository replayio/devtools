import React, { ReactNode, useState } from "react";

import styles from "./Expandable.module.css";
import Icon from "./Icon";
import LazyOffscreen from "./LazyOffscreen";

export type RenderChildrenFunction = () => ReactNode;

export default function Expandable({
  children,
  className = "",
  defaultOpen = false,
  header,
}: {
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  header: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={`${styles.Expandable} ${className}`}>
      <div className={styles.PreviewRow} onClick={toggle}>
        <div className={isOpen ? styles.ArrowExpanded : styles.ArrowCollapsed}>
          <Icon className={styles.ArrowIcon} type="arrow" />
        </div>
        {header}
      </div>

      <LazyOffscreen mode={isOpen ? "visible" : "hidden"}>
        <div className={styles.Children}>{children}</div>
      </LazyOffscreen>
    </div>
  );
}
