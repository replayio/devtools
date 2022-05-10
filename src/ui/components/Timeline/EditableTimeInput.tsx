import React, { useState } from "react";
import { isValidTimeString } from "ui/utils/timeline";

type Props = {
  className?: string;
  defaultValue: string;
  size: number;
  validateAndSave: (formatted: string) => void;
};

export default function EditableTimeInputWrapper({
  className,
  defaultValue,
  size,
  validateAndSave,
}: Props) {
  // Ensures pseudo controlled inputs get recreated whenever values are saved;
  // this ensures the input fields stay in sync with Redux validation logic.
  const [key, setKey] = useState<number>(0);

  const validateAndSaveWrapper = (pending: string) => {
    setKey(key + 1);

    validateAndSave(pending);
  };

  return (
    <EditableTimeInput
      key={key}
      className={className}
      defaultValue={defaultValue}
      size={size}
      validateAndSave={validateAndSaveWrapper}
    />
  );
}

function EditableTimeInput({ className, defaultValue, size, validateAndSave }: Props) {
  const [pendingValue, setPendingValue] = useState<string>(defaultValue);

  const onBlur = (event: React.FocusEvent) => {
    if (pendingValue !== defaultValue) {
      // Don't save on blur unless the value has been modified.
      // This might cause milliseconds to be dropped unexepctedly.
      validateAndSave(pendingValue);
    }
  };

  const onChange = (event: React.ChangeEvent) => {
    const value = (event.currentTarget as HTMLInputElement).value;
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
        validateAndSave(pendingValue);
        break;
    }
  };

  return (
    <input
      className={`${className} focus:outline-none" border-0 bg-themeTextFieldBgcolor p-0 text-xs text-themeTextFieldColor`}
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
