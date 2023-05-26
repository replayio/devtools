import React from "react";

import styles from "./BubbleBackground.module.css";

export default function BubbleBackground() {
  return (
    <div className={styles.container}>
      <div className={styles.bottom}>
        <div className={styles.pinkGrid}></div>
      </div>
    </div>
  );
}
