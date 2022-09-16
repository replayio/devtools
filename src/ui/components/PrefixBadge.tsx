import { setBreakpointPrefixBadge } from "devtools/client/debugger/src/actions/breakpoints";
import { PrefixBadge } from "devtools/client/debugger/src/reducers/types";
import { Breakpoint } from "devtools/client/debugger/src/selectors";
import React from "react";
import { useAppDispatch } from "ui/setup/hooks";
import { PrefixBadgePicker } from "design";

import styles from "./PrefixBadge.module.css";

// Rendered in log point PanelEditor, when a log point is being edited.
// Clicking this item will show the PrefixBadgePicker.
export default function PrefixBadgeButton({ breakpoint }: { breakpoint: Breakpoint }) {
  const dispatch = useAppDispatch();

  return (
    <PrefixBadgePicker
      initialValue={breakpoint.options.prefixBadge}
      onSelect={newPrefixBadge => dispatch(setBreakpointPrefixBadge(breakpoint, newPrefixBadge))}
    />
  );
}

// Rendered in the Console, to the left of message text.
export function MessagePrefixBadge({ prefixBadge }: { prefixBadge: PrefixBadge }) {
  if (!prefixBadge) {
    return null;
  }

  const className =
    prefixBadge === "unicorn"
      ? `${styles.MessagePrefixBadgeUnicorn} ${styles.UnicornBadge}`
      : prefixBadge != null
      ? `${styles.MessagePrefixBadgeSolidColor} ${styles[prefixBadge]}`
      : styles.MessagePrefixBadgeSolidColor;

  return <div className={className} />;
}

// Helper method used by the log point PanelEditor, when a log point is being viewed.
// This ensures the point count has a background color that matches the selected badge.
export function getPrefixBadgeBackgroundColorClassName(prefixBadge?: PrefixBadge) {
  return prefixBadge === "unicorn"
    ? styles.unicorn
    : prefixBadge == null
    ? ""
    : styles[prefixBadge];
}
