import React from "react";

import styles from "./Library.module.css";

export default function ViewerHeader({
  children,
}: {
  children: React.ReactChild | (React.ReactChild | null)[];
}) {
  return (
    <div className={`flex flex-row items-center justify-between ${styles.libraryHeaderButton}`}>
      {children}
    </div>
  );
}

export function ViewerHeaderLeft({
  children,
}: {
  children: React.ReactChild | React.ReactChild[];
}) {
  return (
    <div
      className={`flex flex-row items-center space-x-2 text-2xl font-semibold ${styles.libraryHeaderText}`}
    >
      {children}
    </div>
  );
}
