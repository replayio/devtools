import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";
import Popup from "../Popup";

import styles from "./AutoCompleteInput.module.css";
import getExpressionFromString from "./utils/getExpressionFromString";

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
  const [autoComplete, setAutoComplete] = useState<string | null>(null);

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
    console.group("onChange");
    console.log(`newValue: "${newValue}" (${newValue.length})`);
    console.log(`cursorIndex: ${cursorIndex}`);
    console.log(`cursorIndex: ${cursorIndex} ("${newValue.charAt(newValue.length - 1)}")`);
    console.log(`shouldAutoComplete? ${shouldAutoComplete}`);
    console.log(`expression: "${expression}"`);
    console.groupEnd();
    setAutoComplete(expression);
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
  console.log("<AutoComplete>", autoComplete);

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
      {autoComplete && (
        <Popup target={inputRef.current!}>
          <div className={styles.AutoComplete}>{autoComplete}</div>
        </Popup>
      )}
    </>
  );
}
