import classNames from "classnames";
import React from "react";

export default function Checkbox({
  id,
  checked,
  onChange,
  className,
}: React.HTMLProps<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={classNames(
        "h-4 w-4 rounded border-checkboxBorder bg-checkbox text-primaryAccent focus:ring-primaryAccent",
        className
      )}
      {...{ id, checked, onChange }}
    />
  );
}
