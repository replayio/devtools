import useCurrentPause from "@bvaughn/src/hooks/useCurrentPause";
import { getObjectWithPreviewHelper } from "@bvaughn/src/suspense/ObjectPreviews";
import { createPauseResult as Pause } from "@replayio/protocol";
import { ChangeEvent, KeyboardEvent, useContext, useEffect, useRef, useState } from "react";
import { replayClient, ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import Popup from "../Popup";

import styles from "./AutoCompleteInput.module.css";
import getExpressionFromString from "./utils/getExpressionFromString";

const OBJECT_PROTOTYPE_PROPERTIES = Object.getOwnPropertyNames(Object.prototype);
const ARRAY_PROTOTYPE_PROPERTIES = Object.getOwnPropertyNames(Array.prototype);

export default function AutoCompleteInput({
  autoFocus,
  className = "",
  onCancel: onCancelProp,
  onChange: onChangeProp,
  onSubmit: onSubmitProp,
  value,
}: {
  autoFocus: boolean;
  className: string;
  onCancel: () => void;
  onChange: (newValue: string) => void;
  onSubmit: () => void;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [expression, setExpression] = useState<string | null>(null);
  const [matches, setMatches] = useState<string[] | null>(null);

  const replayClient = useContext(ReplayClientContext);
  const pause = useCurrentPause();

  useEffect(() => {
    if (expression && pause) {
      let cancelled = false;

      const fetchMatches = async () => {
        const matches = await getMatches(replayClient, pause, expression);
        if (!cancelled) {
          setMatches(matches);
        }
      };

      fetchMatches();

      return () => {
        cancelled = true;
      };
    } else {
      setMatches(null);
    }
  }, [expression, pause, replayClient]);

  const onChange = (event: ChangeEvent) => {
    const input = event.currentTarget as HTMLInputElement;
    const newValue = input.value;
    if (newValue !== value) {
      onChangeProp(newValue);
    }

    if (pause === null) {
      setExpression(null);
    } else {
      const cursorIndex = input.selectionStart;
      const shouldAutoComplete =
        cursorIndex === newValue.length &&
        newValue.length > 0 &&
        newValue.charAt(newValue.length - 1) !== " ";
      const expression = shouldAutoComplete
        ? getExpressionFromString(newValue, cursorIndex - 1)
        : null;

      setExpression(expression);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter": {
        event.preventDefault();
        onSubmitProp();
        break;
      }
      case "Escape": {
        event.preventDefault();
        onCancelProp();
        break;
      }
    }
  };

  return (
    <>
      <input
        autoFocus={autoFocus}
        className={`${className} ${styles.Input}`}
        data-test-name="PointPanelContentInput"
        onChange={onChange}
        onKeyDown={onKeyDown}
        ref={inputRef}
        value={value}
      />
      {matches && (
        <Popup target={inputRef.current!}>
          <pre className={styles.AutoComplete}>{/* TODO */ matches.join("\n")}</pre>
        </Popup>
      )}
    </>
  );
}

// TODO
// This might not be sufficient because it doesn't include globals.
// We should fetch and cache those too?
async function getMatches(
  replayClient: ReplayClientInterface,
  pause: Pause,
  expression: string
): Promise<string[]> {
  const { scopes } = pause.data;
  if (!scopes) {
    return [];
  }

  const needle = expression.toLowerCase();

  const matches: string[] = [];
  scopes.forEach(scope => {
    scope.bindings?.forEach(binding => {
      if (binding.name.toLowerCase().startsWith(needle)) {
        insertSorted(binding.name, matches);
      }
    });
  });

  // If there is a global object, it will be the last scope in the list.
  const maybeGlobalObject = scopes[scopes.length - 1];
  const maybeGlobalObjectId = maybeGlobalObject?.object;
  if (maybeGlobalObjectId) {
    const { preview } = await getObjectWithPreviewHelper(
      replayClient,
      pause.pauseId,
      maybeGlobalObjectId,
      true
    );
    const properties = preview?.properties;
    if (properties) {
      properties.forEach(property => {
        if (property.name.toLowerCase().startsWith(needle)) {
          insertSorted(property.name, matches);
        }
      });
    }
  } else {
    [ARRAY_PROTOTYPE_PROPERTIES, OBJECT_PROTOTYPE_PROPERTIES].forEach(properties => {
      properties.forEach(property => {
        if (property.toLowerCase().startsWith(needle)) {
          insertSorted(property, matches);
        }
      });
    });
  }

  return matches;
}

function insertSorted(nameToAdd: string, names: string[]): void {
  let lowIndex = 0;
  let highIndex = names.length;
  while (lowIndex < highIndex) {
    let middleIndex = (lowIndex + highIndex) >>> 1;
    const currentName = names[middleIndex];
    if (nameToAdd.localeCompare(currentName) > 0) {
      lowIndex = middleIndex + 1;
    } else {
      highIndex = middleIndex;
    }
  }

  const insertAtIndex = lowIndex;

  names.splice(insertAtIndex, 0, nameToAdd);
}
