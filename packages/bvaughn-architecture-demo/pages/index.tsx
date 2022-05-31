import React, { Suspense, useCallback, useMemo, useState, useTransition } from "react";

import ErrorBoundary from "../components/ErrorBoundary";
import ConsoleFilters from "../components/console/Filters";
import Focuser from "../components/console/Focuser";
import ConsoleMessages from "../components/console/MessagesList";
import Loader from "../components/Loader";
import {
  ConsoleFiltersContext,
  ConsoleFiltersContextType,
  ConsoleLevelFlags,
  FocusContext,
  FocusContextType,
} from "../src/contexts";
import useDebouncedCallback from "../src/hooks/useDebouncedCallback";
import { Range } from "../src/types";

import styles from "./index.module.css";

// TODO There's a potential hot loop in this code when an error happens (e.g. Linker too old to support Console.findMessagesInRange)
// where React keeps quickly retrying after an error is thrown, rather than rendering an error boundary.
// Filed https://github.com/facebook/react/issues/24634

const FOCUS_DEBOUNCE_DURATION = 250;

export default function HomePage() {
  const [levelFlags, setLevelFlags] = useState<ConsoleLevelFlags>({
    showErrors: true,
    showLogs: true,
    showWarnings: true,
  });

  // Filter input changes quickly while a user types, but re-filtering can be slow.
  // We can use the deferred value hook to allow React to update the visible filter text quickly (at a high priority)
  // and then re-filter the list after a small delay (at a lower priority).
  const [filterByText, setFilterByText] = useState<string>("");
  const [deferredFilterByText, setDeferredFilterByText] = useState<string>("");

  // Changing the focus range may cause us to suspend (while fetching new info from the backend).
  // Wrapping it in a transition enables us to show the older set of messages (in a pending state) while new data loads.
  // This is less jarring than the alternative of unmounting all messages and rendering a fallback loader.
  const [range, setRange] = useState<Range | null>(null);
  const [deferredRange, setDeferredRange] = useState<Range | null>(null);

  // Using a deferred values enables the focus UI to update quickly,
  // and the slower operation of Suspending to load points to be deferred.
  //
  // It also allows us to update the UI slightly, before we suspend to fetch new data,
  // to indicate that what's currently being showed is stale.
  const [isTransitionPending, startTransition] = useTransition();

  const debouncedSetDeferredRange = useDebouncedCallback((newRange: Range | null) => {
    startTransition(() => {
      setDeferredRange(newRange);
    });
  }, FOCUS_DEBOUNCE_DURATION);

  const updateFocusRange = useCallback(
    (newRange: Range | null, debounce: boolean) => {
      setRange(newRange);

      // Focus values may change rapidly (e.g. during a click-and-drag)
      // In this case, React's default high/low priority split is helpful, but we can do more.
      // Debouncing a little before starting the transition helps avoid sending a lot of unused requests to the backend.
      if (debounce) {
        debouncedSetDeferredRange(newRange);
      } else {
        startTransition(() => {
          setDeferredRange(newRange);
        });
      }
    },
    [debouncedSetDeferredRange]
  );

  const focusContext = useMemo<FocusContextType>(
    () => ({
      isTransitionPending,
      rangeForDisplay: range,
      range: deferredRange,
      update: updateFocusRange,
    }),
    [deferredRange, isTransitionPending, range, updateFocusRange]
  );

  const updateFilters = useCallback((newFilterByText: string, newLevelFlags: ConsoleLevelFlags) => {
    setLevelFlags(newLevelFlags);
    setFilterByText(newFilterByText);
    startTransition(() => {
      setDeferredFilterByText(newFilterByText);
    });
  }, []);

  const consoleFiltersContext = useMemo<ConsoleFiltersContextType>(
    () => ({
      filterByDisplayText: filterByText,
      filterByText: deferredFilterByText,
      isTransitionPending,
      levelFlags,
      update: updateFilters,
    }),
    [deferredFilterByText, filterByText, isTransitionPending, levelFlags, updateFilters]
  );

  // TODO Once we have a client implementation to interface with Replay backend,
  // the app can inject a wrapper one that also reports cache hits and misses to this UI in a debug panel.

  return (
    <FocusContext.Provider value={focusContext}>
      <ConsoleFiltersContext.Provider value={consoleFiltersContext}>
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
      </ConsoleFiltersContext.Provider>
    </FocusContext.Provider>
  );
}
