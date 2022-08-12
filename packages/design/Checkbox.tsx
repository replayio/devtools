import * as React from "react";
import classNames from "classnames";

import styles from "./Checkbox.module.css";

export type CheckboxProps = { label?: React.ReactNode; addon?: React.ReactNode } & Pick<
  React.HTMLProps<HTMLInputElement>,
  "id" | "checked" | "className" | "disabled" | "onChange" | "title"
>;

export function Checkbox({
  id,
  checked,
  className,
  disabled,
  label,
  addon,
  onChange,
  title,
  ...props
}: CheckboxProps) {
  const generatedId = React.useId();
  const parsedId = id || generatedId;
  const checkboxProps = {
    disabled,
    id,
    checked,
    onChange,
    type: "checkbox",
  };

  return label ? (
    <div className={classNames(styles.Container, className)} {...props}>
      <input {...checkboxProps} id={parsedId} className={styles.Input} />
      <label htmlFor={parsedId} className={styles.Label}>
        {label}
      </label>
      {addon}
    </div>
  ) : (
    <input {...checkboxProps} {...props} className={classNames(styles.Input, className)} />
  );
}
