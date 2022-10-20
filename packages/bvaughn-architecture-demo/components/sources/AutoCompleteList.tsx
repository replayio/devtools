import useCurrentPause from "@bvaughn/src/hooks/useCurrentPause";
import { getObjectWithPreview } from "@bvaughn/src/suspense/ObjectPreviews";
import { insertSortedString } from "@bvaughn/src/utils/array";
import { Property, Scope } from "@replayio/protocol";
import { CSSProperties, RefObject, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import Popup from "../Popup";

import styles from "./AutoCompleteList.module.css";

const OBJECT_PROTOTYPE_PROPERTIES = Object.getOwnPropertyNames(Object.prototype);
const ARRAY_PROTOTYPE_PROPERTIES = Object.getOwnPropertyNames(Array.prototype);

const LINE_HEIGHT = 20;
const MAX_LIST_HEIGHT = 200;

type ItemData = {
  matches: string[];
  onSubmit: (value: string) => void;
  selectedIndex: number;
};

export default function AutoComplete({
  expression,
  inputRef,
  onSubmit,
}: {
  expression: string | null;
  inputRef: RefObject<HTMLInputElement>;
  onSubmit: (value: string) => void;
}) {
  const replayClient = useContext(ReplayClientContext);

  // This hook suspends
  // We shouldn't call any other hooks after it.
  const pause = useCurrentPause();

  if (!expression || !pause) {
    return null;
  }

  let globalProperties: Property[] | null = null;

  const { scopes } = pause.data;
  if (scopes && scopes.length > 0) {
    const maybeGlobalObject = scopes[scopes.length - 1];
    const maybeGlobalObjectId = maybeGlobalObject?.object;
    if (maybeGlobalObjectId) {
      const { preview } = getObjectWithPreview(
        replayClient,
        pause.pauseId,
        maybeGlobalObjectId,
        true
      );
      globalProperties = preview?.properties || null;
    }
  }

  return (
    <AutoCompleteList
      expression={expression}
      globalProperties={globalProperties}
      inputRef={inputRef}
      onSubmit={onSubmit}
      scopes={scopes || null}
    />
  );
}

function AutoCompleteList({
  expression,
  globalProperties,
  inputRef,
  onSubmit,
  scopes,
}: {
  expression: string | null;
  globalProperties: Property[] | null;
  inputRef: RefObject<HTMLInputElement>;
  onSubmit: (value: string) => void;
  scopes: Scope[] | null;
}) {
  const listRef = useRef<List>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const matches = useMemo(() => {
    return expression ? findMatches(expression.toLowerCase(), scopes, globalProperties) : null;
  }, [expression, scopes, globalProperties]);

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

  return (
    <Popup target={inputRef.current!}>
      <div className={styles.Popup}>
        <List
          className={styles.List}
          height={Math.min(matches.length * LINE_HEIGHT, MAX_LIST_HEIGHT)}
          itemCount={matches.length}
          itemData={{
            matches,
            onSubmit,
            selectedIndex,
          }}
          itemSize={LINE_HEIGHT}
          ref={listRef}
          width={200}
        >
          {Row}
        </List>
      </div>
    </Popup>
  );
}

function Row({ data, index, style }: { data: ItemData; index: number; style: CSSProperties }) {
  const match = data.matches[index];

  return (
    <div
      className={index === data.selectedIndex ? styles.MatchSelected : styles.Match}
      onClick={() => data.onSubmit(match)}
      style={style}
    >
      {match}
    </div>
  );
}

function findMatches(
  needle: string,
  scopes: Scope[] | null,
  globalProperties: Property[] | null
): string[] {
  const matches: string[] = [];

  if (scopes) {
    const matches: string[] = [];
    scopes.forEach(scope => {
      scope.bindings?.forEach(binding => {
        if (binding.name.toLowerCase().startsWith(needle)) {
          insertSortedString(matches, binding.name);
        }
      });
    });
  }

  if (globalProperties) {
    globalProperties.forEach(property => {
      if (property.name.toLowerCase().startsWith(needle)) {
        insertSortedString(matches, property.name);
      }
    });
  } else {
    [ARRAY_PROTOTYPE_PROPERTIES, OBJECT_PROTOTYPE_PROPERTIES].forEach(properties => {
      properties.forEach(property => {
        if (property.toLowerCase().startsWith(needle)) {
          insertSortedString(matches, property);
        }
      });
    });
  }

  return matches;
}
