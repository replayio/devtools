import { createContext, FC, ReactNode, useEffect, useState } from "react";
import debounce from "lodash/debounce";

export interface KeyModifiers {
  meta: boolean;
  shift: boolean;
}

const defaultModifiers = { meta: false, shift: false };
export const KeyModifiersContext = createContext(defaultModifiers);

export const KeyModifiers: FC<{ children: ReactNode }> = ({ children }) => {
  const [meta, setMeta] = useState(false);
  const [shift, setShift] = useState(false);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey) {
      setMeta(true);
    }
    if (e.shiftKey) {
      setShift(true);
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Meta") {
      setMeta(false);
    } else if (e.key === "Shift") {
      setShift(false);
    }
  };
  const onMouseMove = debounce((e: MouseEvent) => {
    if (!e.metaKey) {
      setMeta(false);
    } else if (!e.shiftKey) {
      setShift(false);
    }
  }, 100);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    if (meta || shift) {
      window.addEventListener("mousemove", onMouseMove);
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);

      if (meta || shift) {
        window.removeEventListener("mousemove", onMouseMove);
      }
    };
  });

  return (
    <KeyModifiersContext.Provider value={{ meta, shift }}>{children}</KeyModifiersContext.Provider>
  );
};
