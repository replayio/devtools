import useSearch from "@bvaughn/src/hooks/useSearch";
import type { Actions as SearchActions, State as SearchState } from "@bvaughn/src/hooks/useSearch";
import { Message as ProtocolMessage, Value as ProtocolValue } from "@replayio/protocol";
import { useContext, useMemo, useState } from "react";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";

const EMPTY_ARRAY: any[] = [];

function search(query: string, messages: ProtocolMessage[]): ProtocolMessage[] {
  const results: ProtocolMessage[] = [];

  const needle = query.toLocaleLowerCase();
  messages.forEach(message => {
    if (typeof message.text === "string" && message.text.toLocaleLowerCase().includes(needle)) {
      results.push(message);
    } else {
      message.argumentValues?.some((argumentValue: ProtocolValue) => {
        // TODO Search non-primitive values (nested values) as well.
        // Probably easier if we convert from ProtocolValue to ClientValue first.
        if (typeof argumentValue.value === "string") {
          if (argumentValue.value.toLocaleLowerCase().includes(needle)) {
            console.log("    MATCH!");
            results.push(message);
            return true;
          }
        }
        return false;
      });
    }
  });

  return results;
}

export type Actions = SearchActions & {
  hide: () => void;
  show: () => void;
};

export type State = SearchState<ProtocolMessage> & {
  visible: boolean;
};

const INVISIBLE_STATE: State = {
  results: EMPTY_ARRAY,
  index: -1,
  query: "",
  visible: false,
};

export default function useConsoleSearch(): [State, Actions] {
  const { filteredMessages: messages } = useContext(ConsoleFiltersContext);

  const [state, dispatch] = useSearch<ProtocolMessage>(messages, search);
  const [visible, setVisible] = useState<boolean>(false);

  const externalActions = useMemo(
    () => ({
      ...dispatch,
      hide: () => setVisible(false),
      show: () => setVisible(true),
    }),
    [dispatch]
  );

  const externalState = useMemo(
    () =>
      visible
        ? {
            ...state,
            visible,
          }
        : INVISIBLE_STATE,
    [state, visible]
  );

  return [externalState, externalActions];
}
