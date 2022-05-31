import { Message } from "@replayio/protocol";
import { useMemo } from "react";

// TODO Should this method returned WiredMessage[] or Message[]
export default function useFilteredMessages(
  messages: Message[],
  options: {
    filterByText: string;
    showErrors: boolean;
    showLogs: boolean;
    showWarnings: boolean;
  }
): Message[] {
  const { filterByText, showErrors, showLogs, showWarnings } = options;

  const filteredMessages = useMemo(() => {
    if (showErrors && showLogs && showWarnings && filterByText === "") {
      return messages;
    } else {
      const filterByTextLowercase = filterByText.toLowerCase();

      return messages.filter(message => {
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

        if (filterByTextLowercase !== "") {
          // TODO This is a hacky partial implementation of filter by text.
          if (message.text && message.text.toLowerCase().includes(filterByTextLowercase)) {
            return true;
          } else {
            if (message.argumentValues) {
              return message.argumentValues.find(argumentValue => {
                if (
                  argumentValue.value &&
                  `${argumentValue.value}`.toLowerCase().includes(filterByTextLowercase)
                ) {
                  return true;
                }
              });
            }
          }
        }

        return true;
      });
    }
  }, [filterByText, messages, showErrors, showLogs, showWarnings]);

  return filteredMessages;
}
