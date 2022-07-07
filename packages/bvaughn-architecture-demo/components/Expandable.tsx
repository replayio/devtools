import React, { KeyboardEvent, MouseEvent, ReactNode, useState } from "react";

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

  const onClick = (event: MouseEvent) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter":
      case " ":
        event.stopPropagation();
        setIsOpen(!isOpen);
        break;
    }
  };

  return (
    <div className={`${styles.Expandable} ${className}`} data-test-name="Expandable">
      <div
        className={styles.ToggleButton}
        data-test-name="ExpandablePreview"
        onClick={onClick}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
      >
        <span className={isOpen ? styles.ArrowExpanded : styles.ArrowCollapsed}>
          <Icon className={styles.ArrowIcon} type="arrow" />
        </span>
        {header}
      </div>

      <LazyOffscreen mode={isOpen ? "visible" : "hidden"}>
        <div className={styles.Children} data-test-name="ExpandableChildren">
          {children}
        </div>
      </LazyOffscreen>
    </div>
  );
}
