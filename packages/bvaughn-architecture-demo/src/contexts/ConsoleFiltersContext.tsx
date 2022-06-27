import useFocusRange from "@bvaughn/components/console/hooks/useFocusRange";
import { Message as ProtocolMessage, Value as ProtocolValue } from "@replayio/protocol";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getMessages } from "../suspense/MessagesCache";

export type ConsoleLevelFlags = {
  showErrors: boolean;
  showLogs: boolean;
  showWarnings: boolean;
};

export type ConsoleFiltersContextType = {
  filteredMessages: ProtocolMessage[];

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
  const client = useContext(ReplayClientContext);
  const focusRange = useFocusRange();

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

  const { messages } = getMessages(client, focusRange);

  // Filter in-focus messages by the current criteria.
  const filteredMessages = useMemo<ProtocolMessage[]>(() => {
    const { showErrors, showLogs, showWarnings } = levelFlags;
    if (showErrors && showLogs && showWarnings && deferredFilterByText === "") {
      return messages;
    } else {
      const deferredFilterByTextLowercase = deferredFilterByText.toLowerCase();

      return messages.filter((message: ProtocolMessage) => {
        switch (message.level) {
          case "warning": {
            if (!showWarnings) {
              return false;
            }
            break;
          }
          case "error": {
            if (!showErrors) {
              return false;
            }
            break;
          }
          default: {
            if (!showLogs) {
              return false;
            }
            break;
          }
        }

        if (deferredFilterByTextLowercase !== "") {
          // TODO This is a hacky partial implementation of filter by text.
          if (message.text && message.text.toLowerCase().includes(deferredFilterByTextLowercase)) {
            return true;
          } else {
            if (message.argumentValues) {
              return message.argumentValues.find((argumentValue: ProtocolValue) => {
                if (
                  argumentValue.value &&
                  `${argumentValue.value}`.toLowerCase().includes(deferredFilterByTextLowercase)
                ) {
                  return true;
                }
              });
            }
          }

          return false;
        }

        return true;
      });
    }
  }, [deferredFilterByText, levelFlags, messages]);

  const consoleFiltersContext = useMemo<ConsoleFiltersContextType>(
    () => ({
      filteredMessages,
      filterByDisplayText: filterByText,
      filterByText: deferredFilterByText,
      isTransitionPending,
      levelFlags,
      update: updateFilters,
    }),
    [
      deferredFilterByText,
      filterByText,
      filteredMessages,
      isTransitionPending,
      levelFlags,
      updateFilters,
    ]
  );

  return (
    <ConsoleFiltersContext.Provider value={consoleFiltersContext}>
      {children}
    </ConsoleFiltersContext.Provider>
  );
}
