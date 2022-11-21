import classNames from "classnames";
import * as React from "react";

import styles from "./Checkbox.module.css";

export type CheckboxProps = {
  addon?: React.ReactNode;
  dataTestId?: string;
  label?: React.ReactNode;
} & Pick<
  React.HTMLProps<HTMLInputElement>,
  "id" | "checked" | "className" | "disabled" | "onChange" | "title"
>;

export function Checkbox({
  id,
  checked,
  className,
  dataTestId,
  disabled,
  label,
  addon,
  onChange,
  title,
  ...props
}: CheckboxProps) {
  const generatedId = React.useId();
  const parsedId = id || generatedId;

  const checkboxDataTestId = dataTestId ? `${dataTestId}-Checkbox` : undefined;
  const labelDataTestId = dataTestId ? `${dataTestId}-Label` : undefined;

  const checkboxProps = {
    "data-test-id": checkboxDataTestId,
    disabled,
    id,
    checked,
    onChange,
    type: "checkbox",
  };

  return label ? (
    <div className={classNames(styles.Container, className)} {...props}>
      <input {...checkboxProps} id={parsedId} className={styles.Input} />
      <label data-test-id={labelDataTestId} htmlFor={parsedId} className={styles.Label}>
        {label}
      </label>
      {addon}
    </div>
  ) : (
    <input {...checkboxProps} {...props} className={classNames(styles.Input, className)} />
  );
}
