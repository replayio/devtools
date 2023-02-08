import { PropsWithChildren, createContext, useCallback, useMemo } from "react";

export type InspectorContextType = {
  isExpanded(key: string): boolean | undefined;
  persistIsExpanded(key: string, expanded: boolean): void;
};

export const ExpandablesContext = createContext<InspectorContextType>({
  isExpanded: () => undefined,
  persistIsExpanded: () => {},
});

export function ExpandablesContextRoot({ children }: PropsWithChildren) {
  const expandedKeys = useMemo(() => new Map<string, boolean>(), []);
  const isExpanded = useCallback((key: string) => expandedKeys.get(key), [expandedKeys]);
  const persistIsExpanded = useCallback(
    (key: string, expanded: boolean) => expandedKeys.set(key, expanded),
    [expandedKeys]
  );

  const context = useMemo(
    () => ({ isExpanded, persistIsExpanded }),
    [isExpanded, persistIsExpanded]
  );

  return <ExpandablesContext.Provider value={context}>{children}</ExpandablesContext.Provider>;
}
