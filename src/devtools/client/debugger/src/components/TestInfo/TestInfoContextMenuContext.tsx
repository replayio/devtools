import { PropsWithChildren, createContext, useCallback, useMemo, useState } from "react";

export type Coordinates = {
  x: number;
  y: number;
};

export type TestInfoContextMenuContextType = {
  hide: () => void;
  mouseCoordinates: Coordinates | null;
  show: (mouseCoordinates: Coordinates) => void;
};

export const TestInfoContextMenuContext = createContext<TestInfoContextMenuContextType>(null as any);

export function TestInfoContextMenuContextRoot({ children }: PropsWithChildren) {
  const [mouseCoordinates, setMouseCoordinates] = useState<Coordinates | null>(null);

  const hide = useCallback(() => {
    setMouseCoordinates(null);
  }, []);

  const show = useCallback((mouseCoordinates: Coordinates) => {
    console.log("hi");
    setMouseCoordinates(mouseCoordinates);
  }, []);

  const context = useMemo(
    () => ({
      hide,
      mouseCoordinates,
      show,
    }),
    [hide, mouseCoordinates, show]
  );

  return (
    <TestInfoContextMenuContext.Provider value={context}>
      {children}
    </TestInfoContextMenuContext.Provider>
  );
}
