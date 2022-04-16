import { useEffect, useMemo, useReducer, useRef, useTransition } from "react";
import { useStore } from "react-redux";
import { selectors } from "ui/reducers";
import { Message } from "../../reducers/messages";

export type Actions = {
  hide: () => void;
  goToNext: () => void;
  goToPrevious: () => void;
  search: (query: string) => void;
  show: () => void;
};

export type State = {
  _messages: Message[];
  currentIndex: number;
  query: string;
  results: Message[];
  visible: boolean;
};

type UpdateMessagesAction = { type: "updateMessages"; messages: Message[] };
type UpdateQueryAction = { type: "updateQuery"; query: string };

type Action =
  | { type: "hide" }
  | { type: "goToNext" }
  | { type: "goToPrevious" }
  | { type: "updateSearchResults" }
  | { type: "show" }
  | UpdateMessagesAction
  | UpdateQueryAction;

const EMPTY_ARRAY: Message[] = [];

const initialState: State = {
  _messages: [],
  currentIndex: -1,
  query: "",
  results: EMPTY_ARRAY,
  visible: false,
};

let lastSearchQuery: string = "";
let lastSearchMessages: Message[] = [];
let lastSearchCurrentIndex: number = -1;
let lastSearchResults: Message[] = [];

// Low budget memoization since we're searching in a reducer (which may run more than once).
// TODO [bvaughn] Rethink the approach of searching in a reducer vs in an effect/event handler.
function memoizedSearch(state: State): [Message[], number] {
  const { _messages: messages, currentIndex, query, results } = state;

  const prevSelectedMessage =
    currentIndex >= 0 && results.length > 0 ? results[currentIndex] : null;

  if (lastSearchQuery === query && lastSearchMessages === messages) {
    return [lastSearchResults, lastSearchCurrentIndex];
  }

  lastSearchMessages = messages;
  lastSearchQuery = query;

  if (!query) {
    lastSearchResults = [];
    lastSearchCurrentIndex = -1;
  } else {
    lastSearchResults = [];
    lastSearchCurrentIndex = -1;

    const needle = query.toLocaleLowerCase();

    messages.forEach(message => {
      let matches = false;
      if (typeof message.messageText === "string" && message.messageText.includes(needle)) {
        matches = true;
      } else {
        matches = message.parameters?.some(parameter => {
          if (parameter.isPrimitive()) {
            if (String(parameter.primitive()).toLocaleLowerCase().includes(needle)) {
              return true;
            }
          }
          return false;
        });
      }

      if (matches) {
        lastSearchResults.push(message);

        if (message === prevSelectedMessage) {
          // If previously focused result is still in matches, update currentIndex to match.
          lastSearchCurrentIndex = lastSearchResults.length - 1;
        }
      }
    });
  }

  // If our new search doesn't contain the previously focused result, reset the index.
  if (lastSearchCurrentIndex < 0) {
    lastSearchCurrentIndex = 0;
  }

  return [lastSearchResults, lastSearchCurrentIndex];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hide": {
      return {
        ...state,
        visible: false,
      };
    }
    case "goToNext": {
      const { currentIndex, results } = state;
      return {
        ...state,
        currentIndex: currentIndex < results.length - 1 ? currentIndex + 1 : 0,
      };
    }
    case "goToPrevious": {
      const { currentIndex, results } = state;
      return {
        ...state,
        currentIndex: currentIndex > 0 ? currentIndex - 1 : results.length - 1,
      };
    }
    case "updateSearchResults": {
      const [results, currentIndex] = memoizedSearch(state);
      return {
        ...state,
        currentIndex,
        results,
      };
    }
    case "updateMessages": {
      const messages = (action as UpdateMessagesAction).messages;
      return {
        ...state,
        _messages: messages,
      };
    }
    case "updateQuery": {
      const query = (action as UpdateQueryAction).query;
      return {
        ...state,
        query,
      };
    }
    case "show": {
      return {
        ...state,
        visible: true,
      };
    }
    default: {
      return state;
    }
  }
}

export default function useSearch(): [State, Actions] {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [_, startTransition] = useTransition();

  // When messages/visibleMessages change, schedule a (low-pri) update to re-run search logic.
  const prevMessages = useRef<Message[]>(null as any);
  const store = useStore();
  useEffect(() => {
    const updateStateIfMessagesHaveChanged = () => {
      const state = store.getState();
      const messages = selectors.getMessages(state);
      if (messages !== prevMessages.current) {
        prevMessages.current = messages;
        startTransition(() => {
          dispatch({ type: "updateMessages", messages });
          dispatch({ type: "updateSearchResults" });
        });
      }
    };

    // Check if Messages have changed between render and this effect.
    updateStateIfMessagesHaveChanged();

    return store.subscribe(updateStateIfMessagesHaveChanged);
  }, [store]);

  const actions = useMemo(
    () => ({
      hide: () => {
        dispatch({ type: "hide" });
      },
      goToNext: () => {
        dispatch({ type: "goToNext" });
      },
      goToPrevious: () => {
        dispatch({ type: "goToPrevious" });
      },
      search: (query: string) => {
        // Query text updates with high priority so the input feels snappy.
        dispatch({ type: "updateQuery", query });
        startTransition(() => {
          // Search results are updated in a slightly lower priority.
          dispatch({ type: "updateSearchResults" });
        });
      },
      show: () => {
        dispatch({ type: "show" });
      },
    }),
    []
  );

  return [state, actions];
}
