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

export type TerminalMessage = {
  expression: string;
  id: number;
  frameId: FrameId | null;
  pauseId: PauseId | null;
  point: ExecutionPoint;
  time: number;
  type: "TerminalMessage";
};

type NewMessage = Omit<TerminalMessage, "id" | "type">;

export type TerminalContextType = {
  addMessage: (newMessage: NewMessage) => void;
  isPending: boolean;
  messages: TerminalMessage[];
};

let idCounter: number = 0;

export const TerminalContext = createContext<TerminalContextType>(null as any);

export function TerminalContextRoot({ children }: PropsWithChildren<{}>) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);

  const [isPending, startTransition] = useTransition();

  const addMessage = useCallback((newMessage: Omit<TerminalMessage, "id" | "type">) => {
    startTransition(() => {
      const message: TerminalMessage = {
        ...newMessage,
        id: idCounter++,
        type: "TerminalMessage",
      };

      setMessages(prevMessages => [...prevMessages, message]);
    });
  }, []);

  const context = useMemo(
    () => ({ addMessage, isPending, messages }),
    [addMessage, isPending, messages]
  );

  return <TerminalContext.Provider value={context}>{children}</TerminalContext.Provider>;
}
