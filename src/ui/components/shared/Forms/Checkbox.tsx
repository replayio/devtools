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
        "h-4 w-4 cursor-pointer rounded border-checkboxBorder bg-checkbox text-primaryAccent focus:ring-primaryAccent",
        className
      )}
      {...{ checked, id, onChange }}
    />
  );
}
