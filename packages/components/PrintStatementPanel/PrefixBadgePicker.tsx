import * as React from "react";
import classnames from "classnames";
import { AnimatePresence, motion } from "framer-motion";

import styles from "./PrefixBadgePicker.module.css";

export const badges = ["unicorn", "green", "yellow", "orange", "purple"] as const;

export type PrefixBadges = typeof badges[number];

const openedWidth = 124;
const closedWidth = 28;
const duration = 0.14;
const shadowInitial = "0px 1px 2px 0px rgba(0, 0, 0, 0)";
const shadowActive = "0px 1px 2px 0px rgba(0, 0, 0, 0.25)";

type States = "opening" | "opened" | "closed";

export function PrefixBadgePicker() {
  const [activeBadge, setActiveBadge] = React.useState<PrefixBadges>("unicorn");
  const [state, setState] = React.useState<States>("closed");
  const onSelect = (prefixBadgeName: PrefixBadges) => {
    setState("closed");
    setActiveBadge(prefixBadgeName);
  };
  const isOpen = state === "opening" || state === "opened";

  return (
    <motion.div
      className={styles.PrefixBadgePicker}
      onMouseDown={event => {
        event.preventDefault();
        if (state === "closed") {
          setState("opening");
        }
      }}
      onMouseUp={event => {
        event.preventDefault();
        const button = (event.target as HTMLElement).closest("button");

        if (button) {
          button.focus();
        }

        setState("opened");
      }}
      onBlur={event => {
        if (event.relatedTarget === null) {
          setState("closed");
        }
      }}
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
        {badges.map((badge, index) =>
          isOpen ? (
            <PrefixBadge
              key={badge}
              name={badge}
              onSelect={state === "opening" && index === 0 ? undefined : onSelect}
              onSpaceKeyDown={() => onSelect(badge)}
            />
          ) : badge === activeBadge ? (
            <PrefixBadge key={badge} name={badge} onSpaceKeyDown={() => setState("opened")} />
          ) : null
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PrefixBadge({
  name,
  onSpaceKeyDown,
  onSelect,
}: {
  name: PrefixBadges;
  onSpaceKeyDown: () => void;
  onSelect?: (prefixBadgeName: PrefixBadges) => void;
}) {
  const handleSelect = (event: React.MouseEvent | React.KeyboardEvent) => {
    if (onSelect) {
      event.stopPropagation();
      event.preventDefault();
      onSelect(name);
    }
  };

  return (
    <motion.button
      layoutId={name}
      className={styles.PrefixBadge}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration, layout: { duration: duration / 2 } }}
      onKeyDown={(event: React.KeyboardEvent) => {
        if (event.key === " ") {
          onSpaceKeyDown();
        }
        if (event.key === "Enter") {
          handleSelect(event);
        }
      }}
      onMouseUp={handleSelect}
    >
      <div
        className={
          name === "unicorn" ? styles.UnicornBadge : classnames(styles.ColorBadge, styles[name])
        }
      />
    </motion.button>
  );
}
