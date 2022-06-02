import * as React from "react";
import classnames from "classnames";
import { AnimatePresence, motion } from "framer-motion";

import styles from "./PrintStatementPanel.module.css";

export const badges = ["unicorn", "green", "yellow", "orange", "purple"] as const;

export type PrefixBadges = typeof badges[number];

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
      style={{
        display: "grid",
        gridAutoFlow: "column",
        gridAutoColumns: 20,
        gap: "0.25rem",
        position: "relative",
        alignSelf: "start",
      }}
      onMouseDown={event => {
        event.preventDefault();
        if (state === "closed") {
          setState("opening");
        }
      }}
      onMouseUp={() => {
        setState("opened");
      }}
      whileHover="parentHover"
    >
      <AnimatePresence>
        <motion.div
          initial={false}
          animate={{
            width: isOpen ? 124 : 28,
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
          style={{
            position: "absolute",
            height: "100%",
            backgroundColor: "white",
            borderRadius: "1rem",
          }}
        />
        {badges.map((badge, index) =>
          isOpen ? (
            <PrefixBadge
              key={badge}
              name={badge}
              onSelect={state === "opening" && index === 0 ? undefined : onSelect}
            />
          ) : badge === activeBadge ? (
            <PrefixBadge key={badge} name={badge} />
          ) : null
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PrefixBadge({
  name,
  onSelect,
}: {
  name: PrefixBadges;
  onSelect?: (prefixBadgeName: PrefixBadges) => void;
}) {
  const handleSelect = (event: React.MouseEvent) => {
    if (onSelect) {
      event.stopPropagation();
      event.preventDefault();
      onSelect(name);
    }
  };

  return (
    <motion.button
      layoutId={name}
      style={{ position: "relative", padding: "0.25rem" }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration, layout: { duration: duration / 2 } }}
      onMouseUp={handleSelect}
    >
      <div
        className={classnames(
          styles.PickerItem,
          name === "unicorn" ? styles.UnicornBadge : classnames(styles.ColorBadge, styles[name])
        )}
      />
    </motion.button>
  );
}
