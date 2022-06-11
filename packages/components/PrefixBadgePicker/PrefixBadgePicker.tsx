import type { PrefixBadge } from "devtools/client/debugger/src/reducers/types";
import * as React from "react";
import classNames from "classnames";
import { motion } from "framer-motion";
import { Picker } from "./Picker";

import styles from "./PrefixBadgePicker.module.css";

export const badges = ["unicorn", "green", "yellow", "orange", "purple"] as const;

type States = "opening" | "opened" | "closing" | "closed";

/**
 * Allows picking a prefix badge for identifying console messages more easily.
 * Used in PanelEditor when a log point is being added.
 */
export function PrefixBadgePicker({
  initialState = "closed",
  initialValue = null,
  onSelect,
}: {
  /** The current selected badge. */
  initialValue?: PrefixBadge | null;

  /** Callback when a badge has been selected. */
  onSelect?: (prefixBadge?: PrefixBadge) => void;

  /** Control the opened or closed state. Useful for testing. */
  initialState?: States;
}) {
  const id = (React as any).useId();
  const [activeBadge, setActiveBadge] = React.useState<PrefixBadge | null>(initialValue);
  const [state, setState] = React.useState<States>(initialState);
  const [isHover, setIsHover] = React.useState(false);
  const isOpen = activeBadge === null;
  const isActive = isHover || isOpen || state === "closing";

  const handleSelect = (prefixBadgeName?: PrefixBadge) => {
    setState("closing");
    setActiveBadge(prefixBadgeName || null);
    onSelect?.(prefixBadgeName);
  };

  return (
    <Picker<PrefixBadge>
      value={activeBadge}
      onChange={setActiveBadge}
      padding={1}
      radius={24}
      className={styles.PrefixBadgePicker}
      title={isOpen ? undefined : "Select a prefix badge"}
    >
      <Toggle id="toggle" />
      {badges.map(badge => (
        <motion.button
          key={badge}
          id={badge}
          variants={{ opened: { scale: 1 }, closed: { scale: 0.86 } }}
          className={classNames(styles.PrefixBadge, { [styles.active]: badge === activeBadge })}
        >
          <motion.div
            className={
              badge === "unicorn"
                ? styles.UnicornBadge
                : classNames(styles.ColorBadge, styles[badge])
            }
          />
        </motion.button>
      ))}
    </Picker>
  );
}

function Toggle(props: React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button className={styles.PrefixBadge} {...props}>
      <motion.span
        layout
        variants={{
          opened: { width: "0.5rem", height: "0.1rem" },
          closed: { width: "0.3rem", height: "0.3rem" },
        }}
        transition={{
          backgroundColor: { duration: 0.1 },
          duration: 0.16,
        }}
        className={styles.DefaultBadge}
      />
    </motion.button>
  );
}
