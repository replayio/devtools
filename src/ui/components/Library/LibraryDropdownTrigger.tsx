import React, { KeyboardEventHandler, MouseEventHandler, ReactNode, UIEvent } from "react";

import Icon from "replay-next/components/Icon";

import styles from "./Library.module.css";

export default function LibraryDropdownTrigger({
  onKeyDown,
  onClick,
  label,
  testId,
}: {
  onKeyDown: KeyboardEventHandler;
  onClick: MouseEventHandler;
  label: string;
  testId?: string;
}) {
  return (
    <div
      className={styles.dropdownTrigger}
      data-test-id={testId}
      onKeyDown={onKeyDown}
      onClick={onClick}
      tabIndex={0}
    >
      {label}
      <Icon className="h-5 w-5" type="chevron-down" />
    </div>
  );
}
