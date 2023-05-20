import React, {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  useContext,
  useState,
  useTransition,
} from "react";

import { ExpandablesContext } from "replay-next/src/contexts/ExpandablesContext";

import Icon from "./Icon";
import LazyOffscreen from "./LazyOffscreen";
import styles from "./Expandable.module.css";

export type RenderChildrenFunction = () => ReactNode;

function noopOnChange(value: boolean) {}

export default function Expandable({
  arrowClassName = "",
  children,
  childrenClassName = "",
  className = "",
  defaultOpen = false,
  header,
  headerClassName = "",
  onChange = noopOnChange,
  persistenceKey,
  style,
  useBlockLayoutWhenExpanded = true,
}: {
  arrowClassName?: string;
  children: ReactNode;
  childrenClassName?: string;
  className?: string;
  defaultOpen?: boolean;
  header: ReactNode;
  headerClassName?: string;
  onChange?: (value: boolean) => void;
  persistenceKey?: string;
  style?: CSSProperties;
  useBlockLayoutWhenExpanded?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const { isExpanded, persistIsExpanded } = useContext(ExpandablesContext);
  if (persistenceKey !== undefined) {
    defaultOpen = isExpanded(persistenceKey) ?? defaultOpen;
  }
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    event.stopPropagation();

    if (isPending) {
      return;
    }

    const newIsOpen = !isOpen;

    // In case this change triggers a re-render that suspends, it should be in a transition.
    startTransition(() => {
      onChange(newIsOpen);
      setIsOpen(newIsOpen);
      if (persistenceKey !== undefined) {
        persistIsExpanded(persistenceKey, newIsOpen);
      }
    });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter":
      case "NumpadEnter":
      case " ":
        event.stopPropagation();

        const newIsOpen = !isOpen;

        // In case this change triggers a re-render that suspends, it should be in a transition.
        startTransition(() => {
          onChange(newIsOpen);
          setIsOpen(newIsOpen);
          if (persistenceKey !== undefined) {
            persistIsExpanded(persistenceKey, newIsOpen);
          }
        });
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
      style={style}
    >
      <span
        className={`${styles.ToggleButton} ${headerClassName}`}
        data-test-name="ExpandablePreview"
        onClick={onClick}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
      >
        <span
          className={`${isOpen ? styles.ArrowExpanded : styles.ArrowCollapsed} ${arrowClassName}`}
        >
          <Icon className={styles.ArrowIcon} type="arrow" />
        </span>
        {header}
      </span>

      <LazyOffscreen mode={isOpen ? "visible" : "hidden"}>
        <span
          className={`${childrenClassName} ${styles.Children}`}
          data-test-name="ExpandableChildren"
        >
          {children}
        </span>
      </LazyOffscreen>
    </span>
  );
}
