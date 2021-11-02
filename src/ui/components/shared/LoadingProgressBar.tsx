import React, { useState, useRef, useEffect } from "react";
// import "./LoadingProgressBar.css";

export default function LoadingProgressBar({ initialProgress = 0 }) {
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

  return <div className="loading-progress-bar z-10" style={{ width: `${displayedProgress}%` }} />;
}
