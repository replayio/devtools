import { CSSProperties } from "react";

import styles from "./Loader.module.css";

export default function Loader({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`${className} ${styles.Loader}`} data-test-name="Loader" style={style}>
      Loading…
    </div>
  );
}
