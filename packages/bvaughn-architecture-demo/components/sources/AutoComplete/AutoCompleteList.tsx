import Popup from "@bvaughn/components/Popup";
import useCurrentPause from "@bvaughn/src/hooks/useCurrentPause";
import { getObjectWithPreview } from "@bvaughn/src/suspense/ObjectPreviews";
import { evaluate } from "@bvaughn/src/suspense/PauseCache";
import { createPauseResult as Pause, Property, Scope } from "@replayio/protocol";
import { RefObject, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./AutoCompleteList.module.css";
import AutoCompleteListRow, { ItemData } from "./AutoCompleteListRow";
import find from "./utils/findMatches";

const LINE_HEIGHT = 20;
const MAX_LIST_HEIGHT = 200;

// The legacy auto-complete allowed property previews to overflow.
// This meant we only got a couple of them, which was only of limited use.
// Let's try not allowing overflow and we can disable it if it's too slow.
const PREVIEW_CAN_OVERFLOW = false;

export default function AutoCompleteListOuter({
  dataTestId,
  dataTestName,
  expression,
  inputRef,
  onCancel,
  onSubmit,
}: {
  dataTestId?: string;
  dataTestName?: string;
  expression: string | null;
  inputRef: RefObject<HTMLInputElement>;
  onCancel: () => void;
  onSubmit: (value: string) => void;
}) {
  // This hook suspends so we can't call other hooks after it.
  // There's no point in fetching further data though unless there's a pause (or an expression),
  // so we can bail out early after calling this hook.
  const pause = useCurrentPause();
  if (!expression || !pause) {
    return null;
  }

  return (
    <AutoCompleteListInner
      dataTestId={dataTestId}
      dataTestName={dataTestName}
      expression={expression}
      inputRef={inputRef}
      onCancel={onCancel}
      onSubmit={onSubmit}
      pause={pause}
    />
  );
}

function AutoCompleteListInner({
  dataTestId,
  dataTestName,
  expression,
  inputRef,
  onCancel,
  onSubmit,
  pause,
}: {
  dataTestId?: string;
  dataTestName?: string;
  expression: string;
  inputRef: RefObject<HTMLInputElement>;
  onCancel: () => void;
  onSubmit: (value: string) => void;
  pause: Pause;
}) {
  const replayClient = useContext(ReplayClientContext);

  const listRef = useRef<List>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const [expressionHead, expressionTail] = useMemo<
    [expressionHead: string | null, expressionTail: string | null]
  >(() => {
    if (expression && expression.includes(".")) {
      const pieces = expression.split(".");
      return [pieces.slice(0, -1).join("."), pieces[pieces.length - 1]];
    }
    return [null, expression];
  }, [expression]);

  let properties: Property[] | null = null;
  let scopes: Scope[] | null = pause.data.scopes || null;
  if (expressionHead) {
    // Evaluate the properties of an object (expressionHead)
    const pauseId = pause.pauseId;
    const frameId = pause.data.frames?.[0]?.frameId ?? null;
    const maybeResult = evaluate(replayClient, pauseId, frameId, expressionHead).returned || null;
    const maybeResultId = maybeResult?.object;
    if (maybeResultId) {
      const { preview } = getObjectWithPreview(
        replayClient,
        pause.pauseId,
        maybeResultId,
        !PREVIEW_CAN_OVERFLOW
      );
      properties = preview?.properties || null;
    }
  } else {
    // Evaluate the properties of the global/window object
    if (scopes && scopes.length > 0) {
      const maybeGlobalObject = scopes[scopes.length - 1];
      const maybeGlobalObjectId = maybeGlobalObject?.object;
      if (maybeGlobalObjectId) {
        const { preview } = getObjectWithPreview(
          replayClient,
          pause.pauseId,
          maybeGlobalObjectId,
          !PREVIEW_CAN_OVERFLOW
        );
        properties = preview?.properties || null;
      }
    }
  }

  const matches = useMemo(
    () => find(expressionHead, expressionTail, scopes, properties),
    [expressionHead, expressionTail, scopes, properties]
  );

  useEffect(() => {
    if (matches == null || matches.length == 0) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      let nextIndex: number | null = null;
      switch (event.key) {
        case "Enter": {
          const match = matches[selectedIndex];
          if (match) {
            onSubmit(match);
          }
          break;
        }
        case "ArrowDown": {
          nextIndex = selectedIndex + 1 < matches.length ? selectedIndex + 1 : 0;
          break;
        }
        case "ArrowUp": {
          nextIndex = selectedIndex > 0 ? selectedIndex - 1 : 0;
          break;
        }
      }

      if (nextIndex !== null) {
        event.preventDefault();

        setSelectedIndex(nextIndex);

        const list = listRef.current;
        if (list) {
          list.scrollToItem(nextIndex, "smart");
        }
      }
    };

    if (selectedIndex >= matches.length) {
      setSelectedIndex(matches.length - 1);
    }

    document.body.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.removeEventListener("keydown", onKeyDown);
    };
  }, [matches, onSubmit, selectedIndex]);

  if (matches == null || matches.length === 0) {
    return null;
  }

  const itemData: ItemData = {
    matches,
    onSubmit,
    selectedIndex,
  };

  return (
    <Popup
      dataTestId={dataTestId}
      dataTestName={dataTestName}
      dismiss={onCancel}
      target={inputRef.current!}
    >
      <List
        className={styles.List}
        height={Math.min(matches.length * LINE_HEIGHT, MAX_LIST_HEIGHT)}
        itemCount={matches.length}
        itemData={itemData}
        itemSize={LINE_HEIGHT}
        ref={listRef}
        width={200}
      >
        {AutoCompleteListRow}
      </List>
    </Popup>
  );
}
