import { ChangeEvent, KeyboardEvent, Suspense, useRef, useState } from "react";

import getExpressionFromString from "../utils/getExpressionFromString";

import styles from "./AutoComplete.module.css";
import AutoCompleteList from "./AutoCompleteList";

export default function AutoComplete({
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

  const onChange = (event: ChangeEvent) => {
    const input = event.currentTarget as HTMLInputElement;
    const newValue = input.value;
    if (newValue !== value) {
      onChangeProp(newValue);
    }

    const cursorIndex = input.selectionStart;
    const shouldAutoComplete =
      cursorIndex === newValue.length &&
      newValue.length > 0 &&
      newValue.charAt(newValue.length - 1) !== " ";
    const expression = shouldAutoComplete
      ? getExpressionFromString(newValue, cursorIndex - 1)
      : null;

    setExpression(expression);
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
    }
  };

  const onSubmit = (match: string) => {
    const input = inputRef.current;
    if (input) {
      const value = input.value;
      let cursorIndex = input.selectionStart || value.length;
      while (cursorIndex >= 0) {
        const character = value.charAt(cursorIndex - 1);
        if (character === "." || character === " ") {
          break;
        }
        cursorIndex--;
      }

      const newValue = value.substr(0, cursorIndex) + match;

      onChangeProp(newValue);

      input.focus();
    }

    setExpression(null);
  };

  return (
    <>
      <input
        autoFocus={autoFocus}
        className={`${className} ${styles.Input}`}
        data-test-name="AutoCompleteInput"
        onChange={onChange}
        onKeyDown={onKeyDown}
        ref={inputRef}
        value={value}
      />
      {expression && (
        <Suspense>
          <AutoCompleteList
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
