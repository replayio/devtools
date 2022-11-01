import classNames from "classnames";
import { motion } from "framer-motion";
import * as React from "react";

import { Badge } from "shared/client/types";

import { Picker } from "./Picker";
import styles from "./PrefixBadgePicker.module.css";

export const badges = ["unicorn", "green", "yellow", "orange", "purple"] as const;

/**
 * Allows picking a prefix badge for identifying console messages more easily.
 * Used in PanelEditor when a log point is being added.
 */
export function PrefixBadgePicker({
  initialValue,
  onSelect,
}: {
  /** The current selected badge. */
  initialValue?: Badge | undefined;

  /** Callback when a badge has been selected. */
  onSelect?: (prefixBadge: Badge | undefined) => void;
}) {
  const [activeBadge, setActiveBadge] = React.useState<Badge | undefined>(initialValue);
  const handleSelect = (prefixBadgeName: Badge | undefined) => {
    setActiveBadge(prefixBadgeName);
    onSelect?.(prefixBadgeName);
  };

  return (
    <div className="z-10 flex" style={{ width: 26, height: 26 }}>
      <Picker<Badge | undefined>
        value={activeBadge || undefined}
        onChange={handleSelect}
        className={styles.PrefixBadgePicker}
      >
        <ToggleButton id="toggle" />
        {badges.map(badge => (
          <motion.button
            key={badge}
            id={badge}
            variants={{
              active: { scale: 1 },
              opened: { scale: 1 },
              closed: { scale: 0.82 },
            }}
            className={styles.PrefixBadge}
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
    </div>
  );
}

function ToggleButton(props: React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button {...props} className={classNames(styles.PrefixBadge, props.className)}>
      <motion.span
        layout
        variants={{
          opened: { width: "0.5rem", height: "0.1rem" },
          closed: { width: "0.3rem", height: "0.3rem" },
        }}
        transition={{ duration: 0.16 }}
        className={styles.DefaultBadge}
      />
    </motion.button>
  );
}
