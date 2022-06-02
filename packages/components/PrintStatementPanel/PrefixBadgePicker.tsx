import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import styles from "./PrintStatementPanel.module.css";

export const badges = ["unicorn", "green", "yellow", "orange", "purple"] as const;

export type PrefixBadges = typeof badges[number];

const duration = 0.14;
const shadowInitial = "0px 1px 2px 0px rgba(0, 0, 0, 0)";
const shadowActive = "0px 1px 2px 0px rgba(0, 0, 0, 0.25)";

export function PrefixBadgePicker() {
  const [activeBadge, setActiveBadge] = React.useState<PrefixBadges>("unicorn");
  const [isOpen, setIsOpen] = React.useState(false);
  const onSelect = (prefixBadgeName: PrefixBadges) => {
    setIsOpen(false);
    setActiveBadge(prefixBadgeName);
  };

  return (
    <motion.div
      style={{
        display: "grid",
        gridAutoFlow: "column",
        gridAutoColumns: 20,
        padding: "0.25rem",
        gap: "0.25rem",
        position: "relative",
        alignSelf: "start",
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
        {badges.map(badge =>
          isOpen ? (
            <PrefixBadge key={badge} name={badge} onSelect={onSelect} />
          ) : badge === activeBadge ? (
            <PrefixBadge key={badge} name={badge} onSelect={() => setIsOpen(true)} />
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
  const onClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onSelect?.(name);
  };

  const className =
    name === "unicorn"
      ? styles.UnicornBadge
      : name != null
      ? `${styles.ColorBadge} ${styles[name]}`
      : styles.ColorBadge;

  return (
    <motion.button
      layoutId={name}
      style={{ position: "relative" }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration, layout: { duration: duration / 2 } }}
      onClick={onSelect ? onClick : undefined}
      className={`${styles.PickerItem} ${className}`}
    />
  );
}
