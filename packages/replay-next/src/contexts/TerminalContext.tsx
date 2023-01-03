import { ExecutionPoint, FrameId, PauseId } from "@replayio/protocol";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";

// This context stores (in memory) messages logged to the Replay Console terminal while viewing a recording.

export type TerminalExpression = {
  expression: string;
  id: number;
  frameId: FrameId | null;
  pauseId: PauseId;
  point: ExecutionPoint;
  time: number;
  type: "TerminalExpression";
};

export type NewTerminalExpression = Omit<TerminalExpression, "id" | "type">;

export type TerminalContextType = {
  addMessage: (partialTerminalExpression: NewTerminalExpression) => void;
  clearMessages: () => void;
  isPending: boolean;
  messages: TerminalExpression[];
};

let idCounter: number = 0;

export const TerminalContext = createContext<TerminalContextType>(null as any);

export function TerminalContextRoot({ children }: PropsWithChildren<{}>) {
  const [messages, setMessages] = useState<TerminalExpression[]>([]);

  const [isPending, startTransition] = useTransition();

  const addMessage = useCallback(
    (partialTerminalExpression: Omit<TerminalExpression, "id" | "type">) => {
      startTransition(() => {
        const message: TerminalExpression = {
          ...partialTerminalExpression,
          id: idCounter++,
          type: "TerminalExpression",
        };

        setMessages(prevMessages => [...prevMessages, message]);
      });
    },
    []
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  const context = useMemo(
    () => ({ addMessage, clearMessages, isPending, messages }),
    [addMessage, clearMessages, isPending, messages]
  );

  return <TerminalContext.Provider value={context}>{children}</TerminalContext.Provider>;
}
