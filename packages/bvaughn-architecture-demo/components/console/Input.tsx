import { TerminalContext } from "@bvaughn/src/contexts/TerminalContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { useContext, useEffect, useRef } from "react";

import Icon from "../Icon";

import styles from "./Input.module.css";
import { SearchContext } from "./SearchContext";

export default function Input() {
  const [searchState, searchActions] = useContext(SearchContext);
  const { executionPoint, pauseId, time } = useContext(TimelineContext);
  const { addMessage } = useContext(TerminalContext);

  // TODO (FE-337) It shouldn't be possible for us to have a null pauseId.
  // This blocks global evaluation.
  // How does the legacy content create pauses in this case?
  //
  // Maybe ... createPause()

  const ref = useRef<HTMLInputElement>(null);
  const searchStateVisibleRef = useRef(false);

  useEffect(() => {
    if (!searchState.visible && searchStateVisibleRef.current) {
      ref?.current?.focus();
    }

    searchStateVisibleRef.current = searchState.visible;
  }, [searchState.visible]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "Enter": {
        event.preventDefault();

        const input = ref.current!;
        const content = input.value.trim();
        if (content !== "") {
          input.value = "";

          addMessage({
            content,
            frameId: null,
            pauseId: pauseId!,
            point: executionPoint || "",
            time: time || 0,
          });
        }
        break;
      }
      case "f": {
        if (event.metaKey) {
          event.preventDefault();

          searchActions.show();
        }
        break;
      }
    }
  };

  // TODO (FE-337) Add suspending eager evaluation row (share code with TerminalMessageRenderer)

  return (
    <div className={styles.Container}>
      <Icon className={styles.Icon} type="prompt" />
      <input
        className={styles.Input}
        disabled={pauseId === null}
        onKeyDown={onKeyDown}
        ref={ref}
        type="text"
      />
    </div>
  );
}
