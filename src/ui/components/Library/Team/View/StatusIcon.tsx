import { motion } from "framer-motion";

import Icon from "replay-next/components/Icon";
import { TestExecution } from "shared/test-suites/TestRun";

import styles from "./StatusIcon.module.css";

export function StatusIcon({
  status,
  isProcessed,
}: {
  isProcessed?: boolean;
  status: TestExecution["result"];
}) {
  return (
    <div className={styles.iconWrapper}>
      <motion.div
        className={styles.iconMotion}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 1.0, boxShadow: "0px 0px 1px rgba(0,0,0,0.2)" }}
        transition={{ duration: 0.05 }}
      >
        <Icon
          className={`${styles.icon} ${styles[status] ?? styles.failed}`}
          type={isProcessed ? "play-processed" : "play-unprocessed"}
        />
      </motion.div>
    </div>
  );
}
