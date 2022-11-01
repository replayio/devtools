import { Loggable } from "bvaughn-architecture-demo/components/console/LoggablesContext";
import { createContext, PropsWithChildren, useCallback, useMemo, useState } from "react";

export type Coordinates = {
  x: number;
  y: number;
};

export type ConsoleContextMenuContextType = {
  hide: () => void;
  loggable: Loggable | null;
  mouseCoordinates: Coordinates | null;
  show: (loggable: Loggable, mouseCoordinates: Coordinates) => void;
};

export const ConsoleContextMenuContext = createContext<ConsoleContextMenuContextType>(null as any);

export function ConsoleContextMenuContextRoot({ children }: PropsWithChildren) {
  const [loggable, setLoggable] = useState<Loggable | null>(null);
  const [mouseCoordinates, setMouseCoordinates] = useState<Coordinates | null>(null);

  const hide = useCallback(() => {
    setLoggable(null);
    setMouseCoordinates(null);
  }, []);

  const show = useCallback((loggable: Loggable, mouseCoordinates: Coordinates) => {
    setLoggable(loggable);
    setMouseCoordinates(mouseCoordinates);
  }, []);

  const context = useMemo(
    () => ({
      hide,
      loggable,
      mouseCoordinates,
      show,
    }),
    [hide, loggable, mouseCoordinates, show]
  );

  return (
    <ConsoleContextMenuContext.Provider value={context}>
      {children}
    </ConsoleContextMenuContext.Provider>
  );
}
