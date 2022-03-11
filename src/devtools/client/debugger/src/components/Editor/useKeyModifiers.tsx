import { useEffect, useState } from "react";

export type KeyModifiers = { shift: boolean; meta: boolean };

export function useKeyModifiers() {
  const [meta, setMeta] = useState(false);
  const [shift, setShift] = useState(false);

  const resetKeyModifiers = () => {
    setMeta(false);
    setShift(false);
  };
  const updateKeyModifiers = (modifiers: KeyModifiers) => {
    setMeta(modifiers.meta);
    setShift(modifiers.shift);
  };

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

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  return { keyModifiers: { meta, shift }, resetKeyModifiers, updateKeyModifiers };
}
