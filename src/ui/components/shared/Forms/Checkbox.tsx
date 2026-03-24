import classNames from "classnames";
import React from "react";

export default function Checkbox({
  checked,
  className,
  disabled,
  id,
  onChange,
  ...rest
}: React.HTMLProps<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      checked={checked == true}
      disabled={disabled}
      className={classNames(
        "m-0 h-4 w-4 cursor-pointer rounded border border-checkboxBorder bg-checkbox accent-foreground transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        disabled && "cursor-default opacity-90",
        className
      )}
      id={id}
      onChange={onChange}
      {...rest}
    />
  );
}
