import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import styles from "./PrintStatementPanel.module.css";

export function PrintStatementPanel() {
  return <PrefixBadgePicker />;
}

const badges = ["unicorn", "green", "yellow", "orange", "purple"] as const;

function PrefixBadgePicker() {
  const [activeBadge, setActiveBadge] = React.useState<PrefixBadges>("unicorn");
  const [isOpen, setIsOpen] = React.useState(false);
  const onSelect = (prefixBadgeName: PrefixBadges) => {
    setIsOpen(false);
    setActiveBadge(prefixBadgeName);
  };

  return (
    <div
      style={{
        display: "grid",
        gridAutoFlow: "column",
        gridAutoColumns: 20,
        padding: "0.25rem",
        gap: "0.25rem",
        position: "relative",
        alignSelf: "start",
      }}
    >
      <AnimatePresence>
        <motion.div
          initial={false}
          animate={{
            width: isOpen ? 124 : 28,
          }}
          transition={{
            delay: isOpen ? 0 : 0.5,
            duration: 0.2,
          }}
          style={{
            position: "absolute",
            height: "100%",
            backgroundColor: "white",
            borderRadius: "1rem",
            boxShadow: "0px 1px 2px 0px #00000040",
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
    </div>
  );
}

export type PrefixBadges = "green" | "orange" | "purple" | "unicorn" | "yellow";

function PrefixBadge({
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      //   transition={{ layout: { duration: 0.1 } }}
      onClick={onSelect ? onClick : undefined}
      className={`${styles.PickerItem} ${className}`}
    />
  );
}
