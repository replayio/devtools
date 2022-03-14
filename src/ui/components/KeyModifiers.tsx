import { createContext, FC, ReactNode, useEffect, useState } from "react";
import debounce from "lodash/debounce";

export interface KeyModifiers {
  meta: boolean;
  shift: boolean;
  alt: boolean;
}

const defaultModifiers = { meta: false, shift: false, alt: false };
export const KeyModifiersContext = createContext(defaultModifiers);

export const KeyModifiers: FC<{ children: ReactNode }> = ({ children }) => {
  const [meta, setMeta] = useState(false);
  const [shift, setShift] = useState(false);
  const [alt, setAlt] = useState(false);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey) {
      setMeta(true);
    }
    if (e.shiftKey) {
      setShift(true);
    }
    if (e.altKey) {
      setAlt(true);
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Meta") {
      setMeta(false);
    } else if (e.key === "Shift") {
      setShift(false);
    } else if (e.key === "Alt") {
      setAlt(false);
    }
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!e.metaKey) {
      setMeta(false);
    } else if (!e.shiftKey) {
      setShift(false);
    } else if (!e.altKey) {
      setShift(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    if (meta || shift || alt) {
      window.addEventListener("mousemove", onMouseMove);
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);

      if (meta || shift || alt) {
        window.removeEventListener("mousemove", onMouseMove);
      }
    };
  });

  return (
    <KeyModifiersContext.Provider value={{ meta, shift, alt }}>{children}</KeyModifiersContext.Provider>
  );
};
