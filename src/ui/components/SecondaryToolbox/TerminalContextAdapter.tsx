import React, {
  PropsWithChildren,
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  NewTerminalExpression,
  TerminalContext,
  TerminalExpression,
} from "replay-next/src/contexts/TerminalContext";

export default function TerminalContextController({ children }: PropsWithChildren) {
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<TerminalExpression[]>([]);

  const idCounterRef = useRef(0);

  const addMessage = useCallback((partialTerminalExpression: NewTerminalExpression) => {
    // New expressions should be added in a transition because they suspend.
    startTransition(() => {
      setMessages(prev => [
        ...prev,
        {
          ...partialTerminalExpression,
          id: idCounterRef.current++,
          type: "TerminalExpression",
        },
      ]);
    });
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  const terminalContext = useMemo(
    () => ({
      addMessage,
      clearMessages,
      isPending,
      messages,
    }),
    [addMessage, clearMessages, isPending, messages]
  );

  return <TerminalContext.Provider value={terminalContext}>{children}</TerminalContext.Provider>;
}
