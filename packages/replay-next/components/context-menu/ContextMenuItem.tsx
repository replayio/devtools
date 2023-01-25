import { MouseEvent, ReactNode } from "react";

import styles from "./ContextMenuItem.module.css";

export default function ContextMenuItem({
  children,
  dataTestId,
  dataTestName = "ContextMenuItem",
  dataTestState,
  disabled = false,
  onClick: onClickProp,
}: {
  children: ReactNode;
  dataTestId?: string;
  dataTestName?: string;
  dataTestState?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    event.preventDefault();

    if (!disabled) {
      if (onClickProp) {
        onClickProp();
      }
    }
  };

  return (
    <div
      className={disabled ? styles.ContextMenuItemDisabled : styles.ContextMenuItem}
      data-test-id={dataTestId}
      data-test-name={dataTestName}
      data-test-state={dataTestState}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
