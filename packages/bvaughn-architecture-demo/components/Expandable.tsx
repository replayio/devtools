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
    <div className={`${styles.Expandable} ${className}`} data-test-name="Expandable">
      <button
        className={styles.ToggleButton}
        data-test-name="ExpandablePreview"
        onClick={toggle}
        role="button"
      >
        <span className={isOpen ? styles.ArrowExpanded : styles.ArrowCollapsed}>
          <Icon className={styles.ArrowIcon} type="arrow" />
        </span>
        {header}
      </button>

      <LazyOffscreen mode={isOpen ? "visible" : "hidden"}>
        <div className={styles.Children} data-test-name="ExpandableChildren">
          {children}
        </div>
      </LazyOffscreen>
    </div>
  );
}
