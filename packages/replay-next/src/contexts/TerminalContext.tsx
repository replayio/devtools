import { ExecutionPoint, FrameId, PauseId } from "@replayio/protocol";
import { createContext } from "react";

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

export const TerminalContext = createContext<TerminalContextType>(null as any);
