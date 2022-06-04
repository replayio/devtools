import React, { Suspense } from "react";

import ErrorBoundary from "../components/ErrorBoundary";
import ConsoleFilters from "../components/console/Filters";
import Focuser from "../components/console/Focuser";
import ConsoleMessages from "../components/console/MessagesList";
import Loader from "../components/Loader";
import { ConsoleFiltersContextRoot } from "../src/contexts/ConsoleFiltersContext";
import { FocusContextRoot } from "../src/contexts/FocusContext";

import styles from "./index.module.css";

// TODO There's a potential hot loop in this code when an error happens (e.g. Linker too old to support Console.findMessagesInRange)
// where React keeps quickly retrying after an error is thrown, rather than rendering an error boundary.
// Filed https://github.com/facebook/react/issues/24634

export default function HomePage() {
  // TODO As we finalize the client implementation to interface with Replay backend,
  // we can inject a wrapper here that also reports cache hits and misses to this UI in a debug panel.

  return (
    <FocusContextRoot>
      <ConsoleFiltersContextRoot>
        <div className={styles.Container}>
          <div className={styles.Row}>
            <ConsoleFilters />
          </div>
          <div className={styles.ContentArea}>
            <ErrorBoundary>
              <Suspense fallback={<Loader />}>
                <ConsoleMessages />
              </Suspense>
            </ErrorBoundary>
          </div>
          <div className={styles.Row}>
            <Focuser />
          </div>
        </div>
      </ConsoleFiltersContextRoot>
    </FocusContextRoot>
  );
}
