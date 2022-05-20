import { setBreakpointPrefixBadge } from "devtools/client/debugger/src/actions/breakpoints";
import { PrefixBadge } from "devtools/client/debugger/src/reducers/types";
import { Breakpoint } from "devtools/client/debugger/src/selectors";
import React, { useState, useRef, MutableRefObject } from "react";
import { useDispatch } from "react-redux";
import { useFeature } from "ui/hooks/settings";
import useModalDismissSignal from "ui/hooks/useModalDismissSignal";

import styles from "./PrefixBadge.module.css";

type SelectBadge = (prefixBadge?: PrefixBadge) => void;

// Rendered in log point PanelEditor, when a log point is being edited.
// Clicking this item will show the PrefixBadgePicker.
export default function PrefixBadgeButton({ breakpoint }: { breakpoint: Breakpoint }) {
  const [showPrefixBadge, setShowPrefixBadge] = useState<boolean>(false);
  const { value: enableUnicornConsole } = useFeature("unicornConsole");
  const dispatch = useDispatch();

  if (!enableUnicornConsole) {
    return null;
  }

  const prefixBadge = breakpoint.options.prefixBadge;
  const className =
    prefixBadge === "unicorn"
      ? `${styles.ColorBadgeButton} ${styles.UnicornBadge}`
      : prefixBadge != null
      ? `${styles.ColorBadgeButton} ${styles[prefixBadge]}`
      : `${styles.ColorBadgeButton} ${styles.ColorBadgeButtonEmpty}`;

  return (
    <div className={styles.PrefixBadgeButton}>
      <button
        className={className}
        onClick={() => {
          setShowPrefixBadge(!showPrefixBadge);
        }}
      />
      {showPrefixBadge && (
        <PrefixBadgePicker
          onDismiss={() => setShowPrefixBadge(false)}
          onSelect={newPrefixBadge => {
            console.log("onSelect() newPrefixBadge:", newPrefixBadge);
            setShowPrefixBadge(false);
            dispatch(setBreakpointPrefixBadge(breakpoint, newPrefixBadge));
          }}
        />
      )}
    </div>
  );
}

// Rendered in the Console, to the left of message text.
export function MessagePrefixBadge({ prefixBadge }: { prefixBadge: PrefixBadge }) {
  const { value: enableUnicornConsole } = useFeature("unicornConsole");
  if (!enableUnicornConsole) {
    return null;
  }

  if (!prefixBadge) {
    return null;
  }

  const className =
    prefixBadge === "unicorn"
      ? `${styles.MessagePrefixBadgeUnicorn} ${styles.UnicornBadge}`
      : prefixBadge != null
      ? `${styles.MessagePrefixBadgeSolidColor} ${styles[prefixBadge]}`
      : `${styles.MessagePrefixBadgeSolidColor} ${styles.Empty}`;

  return <div className={className} />;
}

function PrefixBadgePicker({
  onDismiss,
  onSelect,
}: {
  onDismiss: () => void;
  onSelect: SelectBadge;
}) {
  const ref = useRef() as MutableRefObject<HTMLDivElement>;
  useModalDismissSignal(ref, onDismiss);

  return (
    <div className={styles.PopOutContainer} ref={ref}>
      <PrefixBadgePickerItem onSelect={onSelect} prefixBadge="unicorn" />
      <PrefixBadgePickerItem onSelect={onSelect} prefixBadge="orange" />
      <PrefixBadgePickerItem onSelect={onSelect} prefixBadge="yellow" />
      <PrefixBadgePickerItem onSelect={onSelect} prefixBadge="green" />
      <PrefixBadgePickerItem onSelect={onSelect} prefixBadge="purple" />
      <PrefixBadgePickerItem onSelect={onSelect} />
    </div>
  );
}

function PrefixBadgePickerItem({
  prefixBadge,
  onSelect,
}: {
  prefixBadge?: PrefixBadge;
  onSelect: SelectBadge;
}) {
  const onClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    onSelect(prefixBadge);
  };

  const className =
    prefixBadge === "unicorn"
      ? styles.UnicornBadge
      : prefixBadge != null
      ? `${styles.ColorBadge} ${styles[prefixBadge]}`
      : `${styles.ColorBadge} ${styles.Empty}`;

  return <div onClick={onClick} className={`${styles.PickerItem} ${className}`} />;
}

// Helper method used by the log point PanelEditor, when a log point is being viewed.
// This ensures the point count has a background color that matches the selected badge.
export function getPrefixBadgeBackgroundColorClassName(prefixBadge?: PrefixBadge) {
  return prefixBadge === "unicorn"
    ? styles.unicorn
    : prefixBadge == null
    ? styles.Empty
    : styles[prefixBadge];
}
