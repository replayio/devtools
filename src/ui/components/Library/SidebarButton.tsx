import React from "react";
import classNames from "classnames";
import styles from "./Library.module.css";

export default function SidebarButton({
  children,
  underline = false,
  shouldHighlight = false,
  onClick = () => {},
}: {
  children: React.ReactNode;
  underline?: boolean;
  shouldHighlight?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <a
      className={classNames(
        `${styles.teamRow} group flex flex-row justify-between space-x-2 px-4 py-2 text-left transition duration-200 hover:text-white focus:outline-none`,
        { underline },
        shouldHighlight ? `${styles.teamRowActive} cursor-auto` : "cursor-pointer"
      )}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
