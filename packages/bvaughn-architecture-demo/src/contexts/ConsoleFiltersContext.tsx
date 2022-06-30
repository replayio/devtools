import {
  createContext,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";

export type ConsoleLevelFlags = {
  showErrors: boolean;
  showLogs: boolean;
  showWarnings: boolean;
};

export type ConsoleFiltersContextType = {
  // Filter text to display in the UI.
  // This value is updated at React's default, higher priority.
  filterByDisplayText: string;

  // Text to filter console messages by.
  // This value is updated at a lower, transition priority.
  filterByText: string;

  // Filter by text is about to be updated as part of a transition;
  // UI that consumes the focus for Suspense purposes may wish want reflect the temporary pending state.
  isTransitionPending: boolean;

  // Types of console messages to include (or filter out).
  levelFlags: ConsoleLevelFlags;

  update: (filterByText: string, levelFlags: ConsoleLevelFlags) => void;
};

export const ConsoleFiltersContext = createContext<ConsoleFiltersContextType>(null as any);

export function ConsoleFiltersContextRoot({ children }: PropsWithChildren<{}>) {
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

  const updateFilters = useCallback((newFilterByText: string, newLevelFlags: ConsoleLevelFlags) => {
    setLevelFlags(newLevelFlags);
    setFilterByText(newFilterByText);
    startTransition(() => {
      setDeferredFilterByText(newFilterByText);
    });
  }, []);

  // Using a deferred values enables the filter input to update quickly,
  // and the slower operation of filtering the messages in memory to be deferred.
  const [isTransitionPending, startTransition] = useTransition();

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

  return (
    <ConsoleFiltersContext.Provider value={consoleFiltersContext}>
      {children}
    </ConsoleFiltersContext.Provider>
  );
}
