import React from "react";

import styles from "./ModalBackground.module.css";

export default function ModalBackground() {
  return (
    <div className={styles.container}>
      <div className={styles.bottom}>
        <div className={styles.pinkGrid}></div>
      </div>
    </div>
  );
}
