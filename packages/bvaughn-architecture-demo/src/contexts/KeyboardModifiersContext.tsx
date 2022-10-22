import {
  createContext,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

export type KeyboardModifiersContextType = {
  isMetaKeyActive: boolean;
  isPending: boolean;
  isShiftKeyActive: boolean;
};

export const KeyboardModifiersContext = createContext<KeyboardModifiersContextType>(null as any);

export function KeyboardModifiersContextRoot({ children }: PropsWithChildren<{}>) {
  const [isMetaKeyActive, setIsMetaKeyActive] = useState(false);
  const [isShiftKeyActive, setIsShiftKeyActive] = useState(false);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Meta":
        case "Cmd":
        case "Control":
          startTransition(() => {
            setIsMetaKeyActive(true);
          });
          break;
        case "Shift":
          startTransition(() => {
            setIsShiftKeyActive(true);
          });
          break;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Meta":
        case "Cmd":
        case "Control":
          startTransition(() => {
            setIsMetaKeyActive(false);
          });
          break;
        case "Shift":
          startTransition(() => {
            setIsShiftKeyActive(false);
          });
          break;
      }
    };

    document.body.addEventListener("keydown", onKeyDown);
    document.body.addEventListener("keyup", onKeyUp);

    return () => {
      document.body.removeEventListener("keydown", onKeyDown);
      document.body.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const context = useMemo(
    () => ({
      isMetaKeyActive,
      isPending,
      isShiftKeyActive,
    }),
    [isMetaKeyActive, isPending, isShiftKeyActive]
  );

  return (
    <KeyboardModifiersContext.Provider value={context}>
      {children}
    </KeyboardModifiersContext.Provider>
  );
}
