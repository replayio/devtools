import React, { useState, useEffect, useRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import { ThreadFront } from "protocol/thread";
import { prefs } from "../utils/prefs";
import { selectors } from "../reducers";

import { UIState } from "ui/state";

type SkeletonProps = PropsFromRedux & {
  setFinishedLoading(finished: boolean): void;
  progress: number;
  content: React.ReactNode;
};

function SkeletonLoader({ setFinishedLoading, progress = 1, content, viewMode }: SkeletonProps) {
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const key = useRef<any>(null);

  useEffect(() => {
    return () => clearTimeout(key.current);
  }, []);

  useEffect(() => {
    if (displayedProgress == 100) {
      // This gives the Loader component some time (300ms) to bring the progress
      // bar to 100% before unmounting this loader and showing the application.
      setTimeout(async () => {
        await ThreadFront.initializedWaiter.promise;
        setFinishedLoading(true);
      }, 300);
    }

    // This handles the artificial progress bump. It has a randomized increment
    // whose effect is decayed as the progress approaches 100/100. Whenever the
    // underlying progress is higher than the artificial progress, we update to use
    // the underlying progress. Expected behavior assuming no underlying progress is:
    // 10s (50%) 20s (70%) 30s (85%) 45s (95%) 60s (98%)
    key.current = setTimeout(() => {
      const increment = Math.random();
      const decayed = increment * ((100 - displayedProgress) / 40);
      const newDisplayedProgress = Math.max(displayedProgress + decayed, progress);

      setDisplayedProgress(newDisplayedProgress);
    }, 200);
  }, [displayedProgress]);

  return (
    <div className="loader">
      <Header content={content} progress={progress} />
      {viewMode == "non-dev" ? (
        <NonDevMain displayedProgress={displayedProgress} />
      ) : (
        <DevMain displayedProgress={displayedProgress} />
      )}
    </div>
  );
}

interface HeaderProps {
  progress: number;
  content: React.ReactNode;
}

function Header({ progress, content }: HeaderProps) {
  return (
    <header id="header">
      <div className="header-left"></div>
      <div className="message">{progress == 100 ? "Ready" : content}</div>
      <div className="links">
        <div className="loading-placeholder view" />
        <div className="loading-placeholder avatar" />
      </div>
    </header>
  );
}

interface MainProps {
  displayedProgress: number;
}

function NonDevMain({ displayedProgress }: MainProps) {
  return (
    <main>
      <div className="comments" style={{ width: prefs.sidePanelSize as string }}></div>
      <section>
        <div className="video"></div>
        <div className="timeline">
          <div className="loading-container">
            <div className="progress-line full" />
            <div className="progress-line" style={{ width: `${displayedProgress}%` }} />
          </div>
        </div>
      </section>
    </main>
  );
}

function DevMain({ displayedProgress }: MainProps) {
  return (
    <main>
      <section style={{ width: "100%" }}>
        <div className="debugger" />
        <div className="timeline">
          <div className="loading-container">
            <div className="progress-line full" />
            <div className="progress-line" style={{ width: `${displayedProgress}%` }} />
          </div>
        </div>
      </section>
    </main>
  );
}

const connector = connect((state: UIState) => ({
  viewMode: selectors.getViewMode(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(SkeletonLoader);
