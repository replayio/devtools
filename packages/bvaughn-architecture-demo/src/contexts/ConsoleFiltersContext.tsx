import { EventHandlerType } from "@replayio/protocol";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import useLocalStorage from "bvaughn-architecture-demo/src/hooks/useLocalStorage";

import { SessionContext } from "./SessionContext";

// Various boolean flags to types of console messages or attributes to show/hide.
export type Toggles = {
  showErrors: boolean;
  showExceptions: boolean;
  showLogs: boolean;
  showNodeModules: boolean;
  showTimestamps: boolean;
  showWarnings: boolean;
};

export type EventTypes = {
  [eventType: EventHandlerType]: boolean;
};

export type ConsoleFiltersContextType = Toggles & {
  // Event types toggles to display in the UI.
  // The "display" value is updated at React's default, higher priority.
  // The other value is updated at a lower, transition priority.
  eventTypes: EventTypes;
  eventTypesForDisplay: EventTypes;

  // Filter text to display in the UI.
  // The "display" value is updated at React's default, higher priority.
  // The other value is updated at a lower, transition priority.
  filterByText: string;
  filterByDisplayText: string;

  // Filter by text is about to be updated as part of a transition;
  // UI that consumes the focus for Suspense purposes may wish want reflect the temporary pending state.
  isTransitionPending: boolean;

  update: (
    values: Partial<
      Omit<
        ConsoleFiltersContextType,
        "eventTypesForDisplay" | "filterByDisplayText" | "isTransitionPending" | "update"
      >
    >
  ) => void;
};

export const ConsoleFiltersContext = createContext<ConsoleFiltersContextType>(null as any);

export function ConsoleFiltersContextRoot({ children }: PropsWithChildren<{}>) {
  const { recordingId } = useContext(SessionContext);

  const localStorageKey = `Replay:Toggles:${recordingId}`;
  const [toggles, setToggles] = useLocalStorage<Toggles>(localStorageKey, {
    showErrors: true,
    showExceptions: true,
    showLogs: true,
    showNodeModules: false,
    showTimestamps: false,
    showWarnings: false,
  });

  // Filter input changes quickly while a user types, but re-filtering can be slow.
  // We can use the deferred value hook to allow React to update the visible filter text quickly (at a high priority)
  // and then re-filter the list after a small delay (at a lower priority).
  const [filterByText, setFilterByText] = useState<string>("");
  const [deferredFilterByText, setDeferredFilterByText] = useState<string>("");

  const [eventTypes, setEventTypes] = useState<EventTypes>({});
  const [deferredEventTypes, setDeferredEventTypes] = useState<EventTypes>({});

  const update = useCallback(
    (
      values: Partial<
        Omit<
          ConsoleFiltersContextType,
          "eventTypesForDisplay" | "filterByDisplayText" | "isTransitionPending" | "update"
        >
      >
    ) => {
      const { eventTypes: newEventTypes, filterByText: newFilterByText, ...newToggles } = values;

      setToggles(prevToggles => ({
        ...prevToggles,
        ...newToggles,
      }));

      if (newEventTypes != null) {
        setEventTypes(prevEventTypes => ({
          ...prevEventTypes,
          ...newEventTypes,
        }));
        startTransition(() => {
          setDeferredEventTypes(prevEventTypes => ({
            ...prevEventTypes,
            ...newEventTypes,
          }));
        });
      }

      if (newFilterByText != null) {
        setFilterByText(newFilterByText);
        startTransition(() => {
          setDeferredFilterByText(newFilterByText);
        });
      }
    },
    [setToggles]
  );

  // Using a deferred values enables the filter input to update quickly,
  // and the slower operation of filtering the messages in memory to be deferred.
  const [isTransitionPending, startTransition] = useTransition();

  const consoleFiltersContext = useMemo<ConsoleFiltersContextType>(
    () => ({
      ...toggles,
      eventTypes: deferredEventTypes,
      eventTypesForDisplay: eventTypes,
      filterByDisplayText: filterByText,
      filterByText: deferredFilterByText,
      isTransitionPending,
      update,
    }),
    [
      deferredEventTypes,
      deferredFilterByText,
      eventTypes,
      filterByText,
      isTransitionPending,
      toggles,
      update,
    ]
  );

  return (
    <ConsoleFiltersContext.Provider value={consoleFiltersContext}>
      {children}
    </ConsoleFiltersContext.Provider>
  );
}
