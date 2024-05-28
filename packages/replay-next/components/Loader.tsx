import { CSSProperties, ReactNode } from "react";

import styles from "./Loader.module.css";

export default function Loader({
  className = "",
  message = "Loading…",
  style,
}: {
  className?: string;
  message?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className={`${className} ${styles.Loader}`} data-test-name="Loader" style={style}>
      {message}
    </div>
  );
}
