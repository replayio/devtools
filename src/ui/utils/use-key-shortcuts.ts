import { RefObject, useEffect, useRef, useState } from "react";
import KeyShortcuts, { KeyboardEventListener } from "./key-shortcuts";

export default function useKeyShortcuts(
  initialShortcuts: Record<string, KeyboardEventListener>,
  ref?: RefObject<EventTarget>
) {
  const memoizedShortcutsRef = useRef<KeyShortcuts>(null as unknown as KeyShortcuts);
  if (memoizedShortcutsRef.current === null) {
    memoizedShortcutsRef.current = new KeyShortcuts(initialShortcuts);
  }

  const prevTargetRef = useRef<EventTarget | null>(null);

  // Attach shortcut on-mount and re-attach whenever ref.current changes
  useEffect(() => {
    const target = ref ? ref.current : document.body;
    if (prevTargetRef.current !== target) {
      if (target) {
        memoizedShortcutsRef.current.attach(target);
      } else {
        memoizedShortcutsRef.current.detach();
      }
    }

    prevTargetRef.current = target;
  });

  // This will run when the component is unmounted
  useEffect(() => () => memoizedShortcutsRef.current.destroy(), []);
}
