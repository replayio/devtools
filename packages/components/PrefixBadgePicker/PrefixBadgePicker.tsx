import * as React from "react";
import classNames from "classnames";
import { AnimatePresence, motion } from "framer-motion";

import styles from "./PrefixBadgePicker.module.css";

export const badges = ["unicorn", "green", "yellow", "orange", "purple"] as const;

export type PrefixBadge = typeof badges[number];

const openedWidth = 126;
const closedWidth = 24;
const duration = 0.14;
const shadowInitial = "0px 1px 2px 0px rgba(0, 0, 0, 0)";
const shadowActive = "0px 1px 2px 0px rgba(0, 0, 0, 0.25)";

type States = "opening" | "opened" | "closed";

/**
 * Allows picking a prefix badge for identifying console messages more easily.
 * Used in PanelEditor, when a log point is being added.
 */
export function PrefixBadgePicker({
  initialState = "closed",
  onSelect,
}: {
  /** Callback when a badge has been selected. */
  onSelect?: (prefixBadge?: PrefixBadge) => void;

  /** Control the opened or closed state. Useful for testing. */
  initialState?: States;
}) {
  const id = (React as any).useId();
  const [activeBadge, setActiveBadge] = React.useState<PrefixBadge>();
  const [state, setState] = React.useState<States>(initialState);
  const isOpen = state === "opening" || state === "opened";

  const handleSelect = (prefixBadgeName?: PrefixBadge) => {
    setState("closed");
    setActiveBadge(prefixBadgeName);
    onSelect?.(prefixBadgeName);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (state === "closed") {
      setState("opening");
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const button = (event.target as HTMLElement).closest("button");

    if (button) {
      button.focus();
    }

    setState("opened");
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget === null) {
      setState("closed");
    }
  };

  return (
    <motion.div
      className={classNames(styles.PrefixBadgePicker, { [styles.isOpen]: isOpen })}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onBlur={handleBlur}
      whileHover="parentHover"
    >
      <AnimatePresence>
        <motion.div
          initial={false}
          animate={{
            width: isOpen ? openedWidth : closedWidth,
            boxShadow: isOpen ? shadowActive : shadowInitial,
          }}
          transition={{
            delay: isOpen ? 0 : duration,
            duration,
            boxShadow: { duration: 0.2 },
          }}
          variants={{
            parentHover: {
              boxShadow: shadowActive,
            },
          }}
          className={styles.PrefixBadgePickerFill}
        />

        {(activeBadge === undefined || isOpen) && (
          <motion.button
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={styles.PrefixBadge}
            onMouseUp={event => {
              if (state === "opened") {
                event.stopPropagation();
                event.preventDefault();
                handleSelect();
              }
            }}
          >
            <motion.span
              animate={{
                width: isOpen ? "0.5rem" : "0.3rem",
                height: isOpen ? "0.1rem" : "0.3rem",
              }}
              transition={{ type: "tween", duration: 0.16 }}
              className={styles.DefaultBadge}
            />
          </motion.button>
        )}

        {badges.map((badge, index) => {
          const sharedProps = {
            key: badge,
            layoutId: id + badge,
            name: badge,
          };

          return isOpen ? (
            <PrefixBadge
              {...sharedProps}
              active={badge === activeBadge}
              onSelect={state === "opening" && index === 0 ? undefined : handleSelect}
              onSpaceKeyDown={() => handleSelect(badge)}
            />
          ) : badge === activeBadge ? (
            <PrefixBadge {...sharedProps} onSpaceKeyDown={() => setState("opened")} />
          ) : null;
        })}
      </AnimatePresence>
    </motion.div>
  );
}

export function PrefixBadge({
  active,
  name,
  layoutId,
  onSpaceKeyDown,
  onSelect,
}: {
  active?: boolean;
  name: PrefixBadge;
  layoutId: string;
  onSpaceKeyDown: () => void;
  onSelect?: (prefixBadgeName: PrefixBadge) => void;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " ") {
      onSpaceKeyDown();
    }
    if (event.key === "Enter") {
      handleSelect(event);
    }
  };
  const handleSelect = (event: React.MouseEvent | React.KeyboardEvent) => {
    if (onSelect) {
      event.stopPropagation();
      event.preventDefault();
      onSelect(name);
    }
  };

  return (
    <motion.button
      layoutId={layoutId}
      className={classNames(styles.PrefixBadge, { [styles.active]: active })}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration, layout: { duration: duration / 2 } }}
      onKeyDown={handleKeyDown}
      onClick={handleSelect}
      onMouseUp={handleSelect}
    >
      <div
        className={
          name === "unicorn" ? styles.UnicornBadge : classNames(styles.ColorBadge, styles[name])
        }
      />
    </motion.button>
  );
}
