import { useEffect, useRef, useState } from "react";

import styles from "./LoadingProgressBar.module.css";

export function LoadingProgressBar({
  className,
  initialProgress = 0,
}: {
  className?: string;
  initialProgress?: number;
}) {
  const [displayedProgress, setDisplayedProgress] = useState(initialProgress);
  const key = useRef<any>(null);

  useEffect(() => {
    return () => {
      clearTimeout(key.current);
    };
  }, []);

  useEffect(() => {
    key.current = setTimeout(() => {
      if (displayedProgress == 100) {
        return clearTimeout(key.current);
      }

      const increment = Math.random();
      const decayed = increment * ((100 - displayedProgress) / 10);
      const newDisplayedProgress = displayedProgress + decayed;

      setDisplayedProgress(newDisplayedProgress);
    }, 200);
  }, [displayedProgress]);

  return (
    <div className={`${className} ${styles.Wrapper}`}>
      <div
        className={styles.Bar}
        data-testid="loading-progress-bar"
        style={{ width: `${displayedProgress}%` }}
      />
    </div>
  );
}
