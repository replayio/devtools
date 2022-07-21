import { ExecutionPoint, FrameId, PauseId } from "@replayio/protocol";
import {
  createContext,
  PropsWithChildren,
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
  pauseId: PauseId | null;
  point: ExecutionPoint;
  time: number;
  type: "TerminalExpression";
};

type NewMessage = Omit<TerminalExpression, "id" | "type">;

export type TerminalContextType = {
  addMessage: (newMessage: NewMessage) => void;
  clearMessages: () => void;
  isPending: boolean;
  messages: TerminalExpression[];
};

let idCounter: number = 0;

export const TerminalContext = createContext<TerminalContextType>(null as any);

export function TerminalContextRoot({ children }: PropsWithChildren<{}>) {
  const [messages, setMessages] = useState<TerminalExpression[]>([]);

  const [isPending, startTransition] = useTransition();

  const addMessage = useCallback((newMessage: Omit<TerminalExpression, "id" | "type">) => {
    startTransition(() => {
      const message: TerminalExpression = {
        ...newMessage,
        id: idCounter++,
        type: "TerminalExpression",
      };

      setMessages(prevMessages => [...prevMessages, message]);
    });
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  const context = useMemo(
    () => ({ addMessage, clearMessages, isPending, messages }),
    [addMessage, clearMessages, isPending, messages]
  );

  return <TerminalContext.Provider value={context}>{children}</TerminalContext.Provider>;
}
