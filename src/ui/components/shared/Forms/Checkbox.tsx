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
        "focus:ring-primaryAccent h-4 w-4 text-primaryAccent border-gray-300 rounded",
        className
      )}
      {...{ id, checked, onChange }}
    />
  );
}
