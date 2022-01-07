import classNames from "classnames";
import React from "react";

export default React.forwardRef<
  HTMLInputElement,
  Omit<React.HTMLProps<HTMLInputElement>, "type" | "className"> & {
    textSize?: "base" | "lg" | "2xl";
    center?: boolean;
  }
>(function TextInput(props, ref) {
  const { textSize, center } = props;

  return (
    <input
      {...props}
      ref={ref}
      type="text"
      className={classNames(
        `text-${textSize ? textSize : "sm"}`,
        center ? "text-center" : "",
        "text-black focus:ring-primaryAccent focus:border-primaryAccent block w-full border px-2.5 py-1.5 border-textFieldBorder rounded-md"
      )}
    />
  );
});
