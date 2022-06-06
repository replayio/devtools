import type { PrefixBadge } from "devtools/client/debugger/src/reducers/types";
import * as React from "react";
import classNames from "classnames";
import { AnimatePresence, motion } from "framer-motion";

import styles from "./PrefixBadgePicker.module.css";

export const badges = ["unicorn", "green", "yellow", "orange", "purple"] as const;

const openedWidth = 126;
const closedWidth = 24;
const duration = 0.08;
const shadowInitial = "0px 1px 2px 0px rgba(0, 0, 0, 0)";
const shadowActive = "0px 1px 2px 0px rgba(0, 0, 0, 0.25)";

type States = "opening" | "opened" | "closed";

/**
 * Allows picking a prefix badge for identifying console messages more easily.
 * Used in PanelEditor, when a log point is being added.
 */
export function PrefixBadgePicker({
  initialState = "closed",
  initialValue,
  onSelect,
}: {
  /** The current selected badge. */
  initialValue?: PrefixBadge | undefined;

  /** Callback when a badge has been selected. */
  onSelect?: (prefixBadge?: PrefixBadge) => void;

  /** Control the opened or closed state. Useful for testing. */
  initialState?: States;
}) {
  const id = (React as any).useId();
  const [activeBadge, setActiveBadge] = React.useState<PrefixBadge | undefined>(initialValue);
  const [state, setState] = React.useState<States>(initialState);
  const isOpen = state === "opening" || state === "opened";

  const handleSelect = (prefixBadgeName?: PrefixBadge) => {
    setState("closed");
    setActiveBadge(prefixBadgeName);
    onSelect?.(prefixBadgeName);
  };

  return (
    <motion.div
      className={classNames(styles.PrefixBadgePicker, { [styles.isOpen]: isOpen })}
      whileHover="parentHover"
    >
      <AnimateSharedLayout>
        <AnimatePresence>
          <motion.div
            key="fill"
            initial={false}
            animate={{
              width: isOpen ? openedWidth : closedWidth,
              boxShadow: isOpen ? shadowActive : shadowInitial,
            }}
            transition={{
              duration,
              delay: isOpen ? 0 : duration * 3,
              boxShadow: { duration: 0.2, delay: 0 },
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
              key="trigger"
              type="button"
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={styles.PrefixBadge}
              onKeyDown={(event: React.KeyboardEvent) => {
                if (event.key === "Enter") {
                  if (state === "closed") {
                    setState("opening");
                  } else {
                    handleSelect();
                  }
                }
              }}
              onMouseDown={() => {
                if (state === "closed") {
                  setState("opening");
                }
              }}
              onMouseUp={() => {
                if (state === "opened") {
                  handleSelect();
                } else {
                  setState("opened");
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

          {badges.map(badge => {
            const sharedProps = {
              key: badge,
              layoutId: id + badge,
              name: badge,
              onKeyDown: (event: React.KeyboardEvent) => {
                if (event.key === "Enter") {
                  if (state === "closed") {
                    setState("opening");
                  } else {
                    handleSelect(badge);
                  }
                }
              },
              onMouseDown: () => {
                if (state === "closed") {
                  setState("opening");
                }
              },
              onMouseUp: () => {
                if (isOpen) {
                  handleSelect(badge);
                } else {
                  setState("opened");
                }
              },
            };
            const isActive = badge === activeBadge;

            return isOpen ? (
              <PrefixBadgeItem {...sharedProps} isActive={isActive} />
            ) : isActive ? (
              <PrefixBadgeItem {...sharedProps} />
            ) : null;
          })}
        </AnimatePresence>
      </AnimateSharedLayout>
    </motion.div>
  );
}

function PrefixBadgeItem({
  isActive,
  name,
  layoutId,
  ...props
}: {
  isActive?: boolean;
  name: PrefixBadge;
  layoutId: string;
} & Omit<React.ComponentProps<typeof motion.button>, "onSelect">) {
  return (
    <motion.button
      type="button"
      layoutId={layoutId}
      className={classNames(styles.PrefixBadge, { [styles.active]: isActive })}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration }}
      {...props}
    >
      <div
        className={
          name === "unicorn" ? styles.UnicornBadge : classNames(styles.ColorBadge, styles[name])
        }
      />
    </motion.button>
  );
}
