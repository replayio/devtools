import {
  createContext,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";

// Various boolean flags to types of console messages or attributes to show/hide.
export type Toggles = {
  events: {
    [eventType: string]: boolean;
  };
  showErrors: boolean;
  showExceptions: boolean;
  showLogs: boolean;
  showNodeModules: boolean;
  showTimestamps: boolean;
  showWarnings: boolean;
};

export type ConsoleFiltersContextType = Toggles & {
  // Filter text to display in the UI.
  // This value is updated at React's default, higher priority.
  filterByDisplayText: string;

  // Text to filter console messages by.
  // This value is updated at a lower, transition priority.
  filterByText: string;

  // Filter by text is about to be updated as part of a transition;
  // UI that consumes the focus for Suspense purposes may wish want reflect the temporary pending state.
  isTransitionPending: boolean;

  update: (
    values: Partial<
      Omit<ConsoleFiltersContextType, "filterByDisplayText" | "isTransitionPending" | "update">
    >
  ) => void;
};

export const ConsoleFiltersContext = createContext<ConsoleFiltersContextType>(null as any);

export function ConsoleFiltersContextRoot({ children }: PropsWithChildren<{}>) {
  const [toggles, setToggles] = useState<Toggles>({
    events: {},
    showErrors: true,
    showExceptions: true,
    showLogs: true,
    showNodeModules: true,
    showTimestamps: false,
    showWarnings: true,
  });

  // Filter input changes quickly while a user types, but re-filtering can be slow.
  // We can use the deferred value hook to allow React to update the visible filter text quickly (at a high priority)
  // and then re-filter the list after a small delay (at a lower priority).
  const [filterByText, setFilterByText] = useState<string>("");
  const [deferredFilterByText, setDeferredFilterByText] = useState<string>("");

  const update = useCallback(
    (
      values: Partial<
        Omit<ConsoleFiltersContextType, "filterByDisplayText" | "isTransitionPending" | "update">
      >
    ) => {
      const { filterByText: newFilterByText, ...newToggles } = values;

      setToggles(prevToggles => ({
        ...prevToggles,
        ...newToggles,
        events: {
          ...prevToggles.events,
          ...newToggles.events,
        },
      }));

      if (newFilterByText != null) {
        setFilterByText(newFilterByText);
        startTransition(() => {
          setDeferredFilterByText(newFilterByText);
        });
      }
    },
    []
  );

  // Using a deferred values enables the filter input to update quickly,
  // and the slower operation of filtering the messages in memory to be deferred.
  const [isTransitionPending, startTransition] = useTransition();

  const consoleFiltersContext = useMemo<ConsoleFiltersContextType>(
    () => ({
      ...toggles,
      filterByDisplayText: filterByText,
      filterByText: deferredFilterByText,
      isTransitionPending,
      update,
    }),
    [deferredFilterByText, filterByText, isTransitionPending, toggles, update]
  );

  return (
    <ConsoleFiltersContext.Provider value={consoleFiltersContext}>
      {children}
    </ConsoleFiltersContext.Provider>
  );
}
