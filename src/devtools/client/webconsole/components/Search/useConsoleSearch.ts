import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useSearch } from ".";
import { Message } from "../../reducers/messages";
import { getMessages } from "../../selectors";

import type { Actions as SearchActions, State as SearchState } from "./useSearch";

function search(query: string, messages: Message[]): Message[] {
  const results: Message[] = [];

  const needle = query.toLocaleLowerCase();
  messages.forEach(message => {
    if (
      typeof message.messageText === "string" &&
      message.messageText.toLocaleLowerCase().includes(needle)
    ) {
      results.push(message);
    } else {
      message.parameters?.some(parameter => {
        if (parameter.isPrimitive()) {
          if (String(parameter.primitive()).toLocaleLowerCase().includes(needle)) {
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

export type Actions = SearchActions<Message> & {
  hide: () => void;
  show: () => void;
};

export type State = SearchState<Message> & {
  visible: boolean;
};

export default function useConsoleSearch(): [State, Actions] {
  const messages = useSelector(getMessages);
  const [state, dispatch] = useSearch<Message>(messages, search);

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
    () => ({
      ...state,
      visible,
    }),
    [state, visible]
  );

  return [externalState, externalActions];
}
