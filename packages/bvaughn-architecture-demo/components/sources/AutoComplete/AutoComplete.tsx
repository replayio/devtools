import { ChangeEvent, KeyboardEvent, Suspense, useLayoutEffect, useRef, useState } from "react";

import getExpressionFromString from "../utils/getExpressionFromString";
import updateStringWithExpression from "../utils/updateStringWithExpression";
import AutoCompleteList from "./AutoCompleteList";
import styles from "./AutoComplete.module.css";

export default function AutoComplete({
  autoFocus,
  className = "",
  dataTestId,
  dataTestName,
  onCancel: onCancelProp,
  onChange: onChangeProp,
  onSubmit: onSubmitProp,
  value,
}: {
  autoFocus: boolean;
  className: string;
  dataTestId?: string;
  dataTestName?: string;
  onCancel: () => void;
  onChange: (newValue: string) => void;
  onSubmit: () => void;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [expression, setExpression] = useState<string | null>(null);
  const [cursorIndex, setCursorIndex] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (cursorIndex !== null) {
      const input = inputRef.current;
      if (input) {
        input.setSelectionRange(cursorIndex, cursorIndex);
        setCursorIndex(null);
      }
    }
  }, [cursorIndex]);

  const onChange = (event: ChangeEvent) => {
    const input = event.currentTarget as HTMLInputElement;
    const newValue = input.value;
    if (newValue !== value) {
      onChangeProp(newValue);

      updateExpression();
    }
  };

  const updateExpression = () => {
    const input = inputRef.current;
    if (input) {
      const value = input.value;
      const cursorIndex = input.selectionStart || value.length;
      const expression = getExpressionFromString(value, cursorIndex);

      setExpression(expression);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter": {
        if (!expression) {
          event.preventDefault();
          onSubmitProp();
        }
        break;
      }
      case "Escape": {
        event.preventDefault();
        if (expression) {
          setExpression(null);
        } else {
          onCancelProp();
        }
        break;
      }
      case "ArrowLeft":
      case "ArrowRight": {
        updateExpression();
        break;
      }
    }
  };

  const onSubmit = (match: string) => {
    const input = inputRef.current;
    if (input) {
      const value = input.value;
      const cursorIndex = input.selectionStart || value.length;
      const [newValue, newCursorIndex] = updateStringWithExpression(value, cursorIndex, match);

      onChangeProp(newValue);

      setCursorIndex(newCursorIndex);

      input.focus();
    }

    setExpression(null);
  };

  return (
    <>
      <input
        autoFocus={autoFocus}
        className={`${className} ${styles.Input}`}
        data-test-id={dataTestId}
        data-test-name={dataTestName}
        onChange={onChange}
        onKeyDown={onKeyDown}
        ref={inputRef}
        value={value}
      />
      {expression && (
        <Suspense>
          <AutoCompleteList
            dataTestId={dataTestId ? `${dataTestId}-List` : undefined}
            dataTestName={dataTestName ? `${dataTestName}-List` : undefined}
            expression={expression}
            inputRef={inputRef}
            onCancel={onCancelProp}
            onSubmit={onSubmit}
          />
        </Suspense>
      )}
    </>
  );
}
