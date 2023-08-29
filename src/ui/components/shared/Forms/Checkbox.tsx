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
        "m-0 h-4 w-4 cursor-pointer rounded bg-checkbox text-primaryAccent transition-opacity focus:ring-primaryAccent",
        disabled && "cursor-default opacity-90",
        className
      )}
      id={id}
      onChange={onChange}
      {...rest}
    />
  );
}
