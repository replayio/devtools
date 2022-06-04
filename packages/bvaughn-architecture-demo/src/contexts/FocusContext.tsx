import {
  createContext,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";

import useDebouncedCallback from "../hooks/useDebouncedCallback";
import { Range } from "../types";

const FOCUS_DEBOUNCE_DURATION = 250;

export type FocusContextType = {
  // Focus is about to be updated as part of a transition;
  // UI that consumes the focus for Suspense purposes may wish want reflect the temporary pending state.
  isTransitionPending: boolean;
  range: Range | null;
  rangeForDisplay: Range | null;
  update: (value: Range | null, debounce: boolean) => void;
};

export const FocusContext = createContext<FocusContextType>(null as any);

export function FocusContextRoot({ children }: PropsWithChildren<{}>) {
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

  return <FocusContext.Provider value={focusContext}>{children}</FocusContext.Provider>;
}
