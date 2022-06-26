import React, { Suspense, useContext, useMemo } from "react";

import createReplayClientRecorder from "../../shared/client/createReplayClientRecorder";
import { ReplayClientContext } from "../../shared/client/ReplayClientContext";

import CommentList from "../components/comments/CommentList";
import ConsoleRoot from "../components/console";
import ErrorBoundary from "../components/ErrorBoundary";
import Focuser from "../components/console/Focuser";
import Initializer from "../components/Initializer";
import Loader from "../components/Loader";
import { FocusContextRoot } from "../src/contexts/FocusContext";

import styles from "./index.module.css";

// TODO There's a potential hot loop in this code when an error happens (e.g. Linker too old to support Console.findMessagesInRange)
// where React keeps quickly retrying after an error is thrown, rather than rendering an error boundary.
// Filed https://github.com/facebook/react/issues/24634

let recordData = false;
if (typeof window !== "undefined") {
  const url = new URL(window.location.href);
  recordData = url.searchParams.has("record");
}

export default function HomePage() {
  // TODO As we finalize the client implementation to interface with Replay backend,
  // we can inject a wrapper here that also reports cache hits and misses to this UI in a debug panel.

  // Used to record mock data for e2e tests when a URL parameter is present:
  const client = useContext(ReplayClientContext);
  const replayClientRecorder = useMemo(() => createReplayClientRecorder(client), [client]);

  const content = (
    <Initializer>
      <FocusContextRoot>
        <div className={styles.Container}>
          <div className={styles.CommentsContainer}>
            <ErrorBoundary>
              <Suspense fallback={<Loader />}>
                <CommentList />
              </Suspense>
            </ErrorBoundary>
          </div>
          <div className={styles.ConsoleContainer}>
            <ConsoleRoot />
            <div className={styles.Row}>
              <Focuser />
            </div>
          </div>
        </div>
      </FocusContextRoot>
    </Initializer>
  );

  if (recordData) {
    return (
      <ReplayClientContext.Provider value={replayClientRecorder}>
        {content}
      </ReplayClientContext.Provider>
    );
  } else {
    return content;
  }
}
