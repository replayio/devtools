import classNames from "classnames";
import React from "react";

export default function Checkbox({
  id,
  checked,
  disabled,
  onChange,
  className,
}: React.HTMLProps<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      disabled={disabled}
      className={classNames(
        "m-0 h-4 w-4 cursor-pointer rounded border-checkboxBorder bg-checkbox text-primaryAccent focus:ring-primaryAccent",
        className
      )}
      {...{ id, checked, onChange }}
    />
  );
}
