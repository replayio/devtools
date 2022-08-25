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
  headerClassName = "",
  useBlockLayoutWhenExpanded = true,
}: {
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  header: ReactNode;
  headerClassName?: string;
  useBlockLayoutWhenExpanded?: boolean;
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
    <span
      className={`${
        isOpen && useBlockLayoutWhenExpanded ? styles.Block : styles.Inline
      } ${className}`}
      data-test-name="Expandable"
      data-test-state={isOpen ? "open" : "closed"}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
    >
      <span
        className={`${styles.ToggleButton} ${headerClassName}`}
        data-test-name="ExpandablePreview"
      >
        <span className={isOpen ? styles.ArrowExpanded : styles.ArrowCollapsed}>
          <Icon className={styles.ArrowIcon} type="arrow" />
        </span>
        {header}
      </span>

      <LazyOffscreen mode={isOpen ? "visible" : "hidden"}>
        <span className={styles.Children} data-test-name="ExpandableChildren">
          {children}
        </span>
      </LazyOffscreen>
    </span>
  );
}
