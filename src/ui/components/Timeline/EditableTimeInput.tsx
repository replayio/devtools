import React, { useRef, useState } from "react";
import { isValidTimeString } from "ui/utils/timeline";

import styles from "./EditableTimeInput.module.css";

export default function EditableTimeInputWrapper({
  className,
  defaultValue,
  size,
  validateAndSave,
}: {
  className?: string;
  defaultValue: string;
  size: number;
  validateAndSave: (formatted: string) => void;
}) {
  // Ensures pseudo controlled inputs get recreated whenever values are saved;
  // this ensures the input fields stay in sync with Redux validation logic.
  //
  // We could just use defaultValue for this, but it won't necessarily always change.
  // For example, if the user enters an end time of "35" and "36" in a 20 second recording,
  // both will be capped to 20 seconds – so that part of the key won't change.
  const [key, setKey] = useState<number>(0);

  // If the value is saved while the component is still focused (e.g. the "Enter" key)
  // the input should remain focused from the user's POV.
  // Behind the scenes we are recreating (unmounting and remounting) to update the derived state,
  // but the user shouldn't notice this.
  const autoFocusOnMountRef = useRef<boolean>(false);

  const validateAndSaveWrapper = (pending: string, shouldRefocus: boolean) => {
    autoFocusOnMountRef.current = shouldRefocus;

    setKey(key + 1);
    validateAndSave(pending);
  };

  return (
    <EditableTimeInput
      key={`${defaultValue}-${key}`}
      autoFocus={autoFocusOnMountRef.current}
      className={className}
      defaultValue={defaultValue}
      size={size}
      validateAndSave={validateAndSaveWrapper}
    />
  );
}

function EditableTimeInput({
  autoFocus,
  className,
  defaultValue,
  size,
  validateAndSave,
}: {
  autoFocus: boolean;
  className?: string;
  defaultValue: string;
  size: number;
  validateAndSave: (formatted: string, shouldRefocus: boolean) => void;
}) {
  const [pendingValue, setPendingValue] = useState<string>(defaultValue);

  const onBlur = (event: React.FocusEvent) => {
    if (pendingValue !== defaultValue) {
      // Don't save on blur unless the value has been modified.
      // This might cause milliseconds to be dropped unexepctedly.
      validateAndSave(pendingValue, false);
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    if (isValidTimeString(value)) {
      setPendingValue(value);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "Escape":
        setPendingValue(defaultValue);
        break;
      case "Enter":
        // Always save on Enter, even if the value has not been modified.
        // Enter is a strong signal of intent.
        validateAndSave(pendingValue, true);
        break;
    }
  };

  return (
    <input
      autoFocus={autoFocus}
      className={`${className} ${styles.Input}`}
      onBlur={onBlur}
      onChange={onChange}
      onKeyDown={onKeyDown}
      size={size}
      style={{
        maxWidth: `${size}ch`,
        minWidth: `${size}ch`,
        width: `${size}ch`,
      }}
      type="text"
      value={pendingValue}
    />
  );
}
