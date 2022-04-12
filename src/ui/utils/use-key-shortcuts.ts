import { RefObject, useEffect, useState } from "react";
import KeyShortcuts, { KeyboardEventListener } from "./key-shortcuts";

export default function useKeyShortcuts(
  initialShortcuts: Record<string, KeyboardEventListener>,
  ref?: RefObject<EventTarget>
) {
  // This will create exactly one KeyShortcuts instance per component instance.
  // It may seem tempting to use `useMemo` for this, but the React documentation
  // explicitly states that it shouldn't be relied on to run only once.
  const [shortcuts] = useState(() => new KeyShortcuts(initialShortcuts));

  // This will run once after the first render and whenever ref.current changes
  useEffect(() => {
    if (ref) {
      if (ref.current) {
        shortcuts.attach(ref.current);
      } else {
        shortcuts.detach();
      }
    } else {
      shortcuts.attach(document.body);
    }
  }, [ref?.current]);

  // This will run when the component is unmounted
  useEffect(() => () => shortcuts.destroy(), []);
}
