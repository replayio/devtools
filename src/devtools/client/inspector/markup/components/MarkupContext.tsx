import { createContext } from "react";

export interface MarkupContextValue {
  loadingFailed: boolean;
  rootNodeId: string | null;
  pauseId: string | undefined;
  collapseAttributes: boolean;
  collapseAttributeLength: number;
}

export const MarkupContext = createContext<MarkupContextValue>({
  loadingFailed: false,
  rootNodeId: null,
  pauseId: undefined,
  collapseAttributes: false,
  collapseAttributeLength: 120,
});
